import express from "express";
import { authorizePayment } from "./payments.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ service: "payment-api", status: "ok" });
});

app.post("/authorize", authorizePayment);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "internal_error" });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`payment-api listening on port ${port}`);
});
