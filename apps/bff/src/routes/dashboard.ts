import { Hono } from "hono";
import { buildOpsInsights, dashboardViewSchema } from "@usen-pay/domain";
import { fetchMerchantDashboard } from "../infrastructure/core-api-client";

export const dashboardRoute = new Hono();

dashboardRoute.get("/", async (context) => {
  const dashboard = await fetchMerchantDashboard();
  const view = dashboardViewSchema.parse({
    ...dashboard,
    insights: buildOpsInsights(dashboard),
    generatedAt: new Date().toISOString()
  });

  return context.json(view);
});
