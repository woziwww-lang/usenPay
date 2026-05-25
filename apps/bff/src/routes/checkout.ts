import { Hono } from "hono";
import { errorStatus, runCheckoutAction } from "../infrastructure/core-api-client";

export const checkoutRoute = new Hono();

checkoutRoute.post("/:checkoutId/:action", async (context) => {
  const checkoutId = context.req.param("checkoutId");
  const action = context.req.param("action");

  if (!isCheckoutAction(action)) {
    return context.json({ error: "Unknown checkout action" }, 404);
  }

  const body = await context.req.json().catch(() => ({}));

  try {
    return context.json(await runCheckoutAction(checkoutId, action, body));
  } catch (error) {
    return context.json(
      { error: error instanceof Error ? error.message : "Checkout action failed" },
      errorStatus(error),
    );
  }
});

function isCheckoutAction(value: string): value is "settle" | "split" | "discount" | "receipt" {
  return value === "settle" || value === "split" || value === "discount" || value === "receipt";
}
