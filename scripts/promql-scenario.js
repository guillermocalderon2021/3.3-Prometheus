import { APP_URL, sleep, waitForApplication } from "./common.js";

// Duración de cada fase del escenario. Se puede ajustar con la variable de entorno PHASE_SECONDS.
const PHASE_SECONDS = Number(process.env.PHASE_SECONDS ?? 80);

if (!Number.isFinite(PHASE_SECONDS) || PHASE_SECONDS <= 0) {
  throw new Error("PHASE_SECONDS debe ser un número mayor que cero.");
}

// Cada fase genera un patrón distinto de carga para observar cómo cambia el comportamiento
// de las métricas de Prometheus según la latencia, el número de peticiones concurrentes y
// los errores de negocio o de timeout.
const phases = [
  { id: "A", rate: 1, postScenario: () => "normal" },
  { id: "B", rate: 4, postScenario: () => "normal" },
  {
    id: "C",
    rate: 4,
    postScenario: (postIndex) =>
      postIndex % 2 === 0 ? "normal" : "payment-timeout"
  },
  { id: "D", rate: 4, postScenario: () => "slow" },
  { id: "E", rate: 1, postScenario: () => "normal" }
];

// Seguimiento de las solicitudes vigentes y del total de respuestas según su código HTTP.
const inFlight = new Set();
const totals = new Map();
let requestSequence = 0;
let postSequence = 0;

// Convierte un timestamp de inicio en una etiqueta tipo MM:SS para imprimir el progreso.
function elapsedLabel(startedAt) {
  const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
  const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
  const seconds = String(elapsedSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

// Acumula los resultados por estado para luego resumir la distribución de respuestas.
function recordStatus(status) {
  totals.set(status, (totals.get(status) ?? 0) + 1);
}

// Genera una petición real hacia la API de órdenes. La mitad las hace POST con un escenario
// concreto y la otra mitad hace GET para observar picos de carga en rutas distintas.
function launchRequest(phase) {
  const sequence = requestSequence++;
  const usePost = sequence % 2 === 0;

  let promise;

  if (usePost) {
    const scenario = phase.postScenario(postSequence++);
    const orderId =
      `ord-promql-${phase.id.toLowerCase()}-${String(sequence + 1).padStart(4, "0")}`;

    promise = fetch(`${APP_URL}/orders`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ order_id: orderId, scenario })
    });
  } else {
    promise = fetch(`${APP_URL}/orders/ord-1001`);
  }

  const tracked = promise
    .then((response) => {
      recordStatus(response.status);
      return response.arrayBuffer();
    })
    .catch((error) => {
      recordStatus("transport_error");
      console.error(
        `Error de transporte en fase ${phase.id}: ${error.message}`
      );
    })
    .finally(() => {
      inFlight.delete(tracked);
    });

  inFlight.add(tracked);
}

// Ejecuta una fase concreta: programa las solicitudes a una tasa determinada durante el tiempo
// establecido y luego espera a que termine esa ventana antes de pasar a la siguiente etapa.
async function runPhase(phase, startedAt) {
  const intervalMs = 1000 / phase.rate;
  const durationMs = PHASE_SECONDS * 1000;
  const phaseStartedAt = Date.now();
  const expectedRequests = Math.floor(PHASE_SECONDS * phase.rate);

  console.log(
    `Fase ${phase.id} | ${elapsedLabel(startedAt)} | ${phase.rate} req/s`
  );

  for (let index = 0; index < expectedRequests; index += 1) {
    const scheduledAt = phaseStartedAt + index * intervalMs;
    const waitMs = scheduledAt - Date.now();

    if (waitMs > 0) {
      await sleep(waitMs);
    }

    launchRequest(phase);
  }

  const remainingMs = phaseStartedAt + durationMs - Date.now();
  if (remainingMs > 0) {
    await sleep(remainingMs);
  }
}

// Espera a que la aplicación esté disponible antes de empezar a inyectar tráfico.
await waitForApplication();

const startedAt = Date.now();
console.log("Escenario PromQL iniciado.");
console.log(`Duración por fase: ${PHASE_SECONDS} s`);

// Ejecuta todas las fases del patrón para generar una historia temporal útil para PromQL.
for (const phase of phases) {
  await runPhase(phase, startedAt);
}

// Espera a que todas las peticiones pendientes terminen antes de resumir los resultados.
await Promise.allSettled([...inFlight]);

console.log(`Escenario completado | ${elapsedLabel(startedAt)}`);

// Cuenta únicamente las respuestas reales para analizar la distribución final de códigos HTTP.
const completed = [...totals.entries()]
  .filter(([status]) => status !== "transport_error")
  .reduce((sum, [, count]) => sum + count, 0);

console.log(`Solicitudes HTTP completadas: ${completed}`);

for (const [status, count] of [...totals.entries()].sort(([a], [b]) =>
  String(a).localeCompare(String(b))
)) {
  console.log(`${status}: ${count}`);
}
