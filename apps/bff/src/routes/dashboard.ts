import { Hono } from "hono";
import { errorStatus, fetchDashboardView } from "../infrastructure/core-api-client";

export const dashboardRoute = new Hono();

dashboardRoute.get("/", async (context) => {
  try {
    return context.json(await fetchDashboardView());
  } catch (error) {
    return context.json(
      { error: error instanceof Error ? error.message : "Dashboard request failed" },
      errorStatus(error),
    );
  }
});
