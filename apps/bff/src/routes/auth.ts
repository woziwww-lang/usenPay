import { Hono } from "hono";
import { errorStatus, loginManager } from "../infrastructure/core-api-client";

export const authRoute = new Hono();

authRoute.post("/login", async (context) => {
  const body = await context.req.json<{ managerId?: string }>().catch((): { managerId?: string } => ({}));

  try {
    return context.json(await loginManager(body.managerId ?? ""));
  } catch (error) {
    return context.json(
      { error: error instanceof Error ? error.message : "Login failed" },
      errorStatus(error),
    );
  }
});
