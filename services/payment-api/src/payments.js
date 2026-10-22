const delay = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const scenarioDelay = {
  normal: 80,
  slow: 350,
  "payment-timeout": 700
};

export async function authorizePayment(req, res) {
  const {
    order_id = "ord-generated",
    scenario = "normal"
  } = req.body;

  if (!(scenario in scenarioDelay)) {
    return res.status(400).json({
      error: "unknown_scenario",
      supported: Object.keys(scenarioDelay)
    });
  }

  await delay(scenarioDelay[scenario]);

  if (scenario === "payment-timeout") {
    return res.status(504).json({
      error: "payment_timeout",
      order_id
    });
  }

  return res.status(200).json({
    order_id,
    status: "authorized"
  });
}
