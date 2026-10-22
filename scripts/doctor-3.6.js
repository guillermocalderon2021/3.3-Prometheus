import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

let ok = true;

function check(condition, message) {
  console.log(`${condition ? "✓" : "✗"} ${message}`);
  if (!condition) ok = false;
}

const major = Number(process.versions.node.split(".")[0]);
check(major >= 22, `Node.js ${process.versions.node} (se requiere >= 22)`);

const dockerVersion = spawnSync("docker", ["--version"], { encoding: "utf8" });
check(
  dockerVersion.status === 0,
  dockerVersion.status === 0
    ? dockerVersion.stdout.trim()
    : "Docker CLI disponible"
);

const composeVersion = spawnSync("docker", ["compose", "version"], { encoding: "utf8" });
check(
  composeVersion.status === 0,
  composeVersion.status === 0
    ? composeVersion.stdout.trim()
    : "Docker Compose disponible"
);

const requiredFiles = [
  "compose-3.6.yaml",
  "services/orders-api/Dockerfile",
  "services/orders-api/src/server.js",
  "services/orders-api/src/orders.js",
  "services/orders-api/src/metrics.js",
  "services/payment-api/Dockerfile",
  "services/payment-api/src/server.js",
  "services/payment-api/src/payments.js",
  "prometheus/prometheus-3.6.yml"
];

for (const file of requiredFiles) {
  check(existsSync(resolve(file)), `Archivo presente: ${file}`);
}

console.log("");
if (ok) {
  console.log("RESULTADO: ENTORNO 3.6 LISTO");
  process.exit(0);
}

console.log("RESULTADO: REVISAR ENTORNO");
process.exit(1);
