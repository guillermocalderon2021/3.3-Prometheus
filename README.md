# Métricas de Software 3.6: OpenTelemetry

Rama de apoyo para la sesión 3.6 del curso Métricas de Software.

Esta rama conserva el comportamiento observable utilizado en 3.3, 3.4 y 3.5, pero separa la autorización de pago en un segundo servicio HTTP.

## Arquitectura

```text
cliente
   |
   | POST /orders
   v
orders-api
   |
   | POST /authorize
   v
payment-api
```

`orders-api` continúa exponiendo las métricas utilizadas en las clases anteriores. `payment-api` concentra el comportamiento de la autorización de pago y proporciona un límite real entre procesos para estudiar propagación de contexto y trazas distribuidas.

## Escenarios de POST /orders

| Escenario | payment-api | Resultado de orders-api |
|---|---:|---|
| `normal` | ~80 ms, HTTP 200 | HTTP 201 |
| `slow` | ~350 ms, HTTP 200 | HTTP 201 |
| `payment-timeout` | ~700 ms, HTTP 504 | HTTP 504 |

Los tiempos son deterministas y tienen propósito didáctico.

## Verificar archivos

```bash
node scripts/doctor-3.6.js
```

## Levantar el entorno

```bash
docker compose -f compose-3.6.yaml up --build -d
```

Servicios:

```text
orders-api    http://localhost:3000
Grafana       http://localhost:3001
payment-api   http://localhost:3002
Prometheus    http://localhost:9090
cAdvisor      http://localhost:8080
```

Comprobación:

```bash
curl http://localhost:3000/health
curl http://localhost:3002/health
```

## Ejecutar el escenario conocido

Los scripts de 3.4 y 3.5 continúan enviando solicitudes a `orders-api`.

```bash
npm run promql:scenario
```

El cambio arquitectónico no modifica la intención del escenario A-E. La duración de `POST /orders` incluye ahora una llamada HTTP real a `payment-api`, por lo que puede existir un pequeño overhead adicional respecto de las mediciones anteriores.

## Estructura relevante

```text
services/
├── orders-api/
│   ├── Dockerfile
│   └── src/
│       ├── metrics.js
│       ├── orders.js
│       └── server.js
└── payment-api/
    ├── Dockerfile
    └── src/
        ├── payments.js
        └── server.js
```

## Alcance de esta base

Esta primera versión de la rama establece el límite distribuido necesario para 3.6. La instrumentación OpenTelemetry se añadirá sobre esta arquitectura sin cambiar nuevamente el caso de negocio.
