import express from "express";
import { register } from "./metrics.js";
import { createOrder, getOrder } from "./orders.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ service: "orders-api", status: "ok" });
});

app.get("/metrics", async (_req, res, next) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    next(error);
  }
});

app.post("/orders", createOrder);
app.get("/orders/:id", getOrder);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "internal_error" });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`orders-api listening on port ${port}`);
});
