import { buildOpsInsights, dashboardFixture, dashboardViewSchema } from "@usen-pay/domain";

export const dashboardViewFixture = dashboardViewSchema.parse({
  ...dashboardFixture,
  insights: buildOpsInsights(dashboardFixture),
  generatedAt: "2026-05-20T05:00:00.000Z",
});
