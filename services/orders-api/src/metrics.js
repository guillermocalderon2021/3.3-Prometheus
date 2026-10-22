import * as client from "@prometheus-io/client";

export const requestsTotal = new client.Counter({
  name: "orders_http_requests_total",
  help: "Total number of HTTP requests processed.",
  labelNames: ["method", "route", "status_code"]
});

export const requestsInProgress = new client.Gauge({
  name: "orders_http_requests_in_progress",
  help: "HTTP requests currently being processed.",
  labelNames: ["route"]
});

export const requestDuration = new client.Histogram({
  name: "orders_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds.",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2]
});

export const register = client.register;
