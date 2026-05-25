import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  applyCheckoutDiscount,
  buildMockDashboard,
  getStoreSettings,
  isMockScenario,
  issueReceipt,
  loginManager,
  type MockScenario,
  scenarioNames,
  settleCheckout,
  splitCheckout,
  updateStoreSettings,
} from "./scenarios";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
  }),
);

app.get("/health", (context) => context.json({ ok: true, service: "usen-pay-mock-server" }));

app.get("/scenarios", (context) =>
  context.json({
    scenarios: scenarioNames,
    defaultScenario: "default" satisfies MockScenario,
  }),
);

app.get("/dashboard", (context) => {
  const scenario = context.req.query("scenario") ?? "default";

  if (!isMockScenario(scenario)) {
    return context.json({ error: "Unknown mock scenario", scenarios: scenarioNames }, 404);
  }

  return context.json(buildMockDashboard(scenario));
});

app.get("/dashboard/:scenario", (context) => {
  const scenario = context.req.param("scenario");

  if (!isMockScenario(scenario)) {
    return context.json({ error: "Unknown mock scenario", scenarios: scenarioNames }, 404);
  }

  return context.json(buildMockDashboard(scenario));
});

app.post("/auth/login", async (context) => {
  const body = await context.req.json<{ managerId?: string }>().catch((): { managerId?: string } => ({}));
  const manager = loginManager(body.managerId ?? "");

  if (!manager) {
    return context.json({ error: "Invalid manager account" }, 401);
  }

  return context.json({
    managerId: body.managerId,
    ...manager,
  });
});

app.get("/settings", (context) => context.json(getStoreSettings()));

app.patch("/settings", async (context) => {
  const body = await context.req.json().catch(() => ({}));
  return context.json({
    settings: updateStoreSettings(body),
    message: "Settings saved",
  });
});

app.post("/checkout/:checkoutId/settle", (context) => {
  const result = settleCheckout(context.req.param("checkoutId"));
  if (!result) {
    return context.json({ error: "Checkout not found" }, 404);
  }

  return context.json({
    ...result,
    message: `Checkout ${context.req.param("checkoutId")} settled`,
  });
});

app.post("/checkout/:checkoutId/split", async (context) => {
  const body = await context.req.json<{ parts?: number }>().catch((): { parts?: number } => ({}));
  const result = splitCheckout(context.req.param("checkoutId"), body.parts);
  if (!result) {
    return context.json({ error: "Checkout not found" }, 404);
  }

  return context.json({
    ...result,
    message: `Split into ${result.parts} payments`,
  });
});

app.post("/checkout/:checkoutId/discount", async (context) => {
  const body = await context.req.json<{ amount?: number }>().catch((): { amount?: number } => ({}));
  const result = applyCheckoutDiscount(context.req.param("checkoutId"), body.amount);
  if (!result) {
    return context.json({ error: "Checkout not found" }, 404);
  }

  return context.json({
    ...result,
    message: `Discount applied to ${context.req.param("checkoutId")}`,
  });
});

app.post("/checkout/:checkoutId/receipt", (context) => {
  const receipt = issueReceipt(context.req.param("checkoutId"));
  if (!receipt) {
    return context.json({ error: "Checkout not found" }, 404);
  }

  return context.json({
    receipt,
    message: `Receipt ${receipt.receiptNo} issued`,
  });
});

const port = Number(process.env.PORT ?? 8790);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`USEN PAY mock server listening on http://localhost:${info.port}`);
});

export type MockServerApp = typeof app;
