import { Hono } from "hono";
import { errorStatus, fetchStoreSettings, saveStoreSettings } from "../infrastructure/core-api-client";

export const settingsRoute = new Hono();

settingsRoute.get("/", async (context) => {
  try {
    return context.json(await fetchStoreSettings());
  } catch (error) {
    return context.json(
      { error: error instanceof Error ? error.message : "Settings request failed" },
      errorStatus(error),
    );
  }
});

settingsRoute.patch("/", async (context) => {
  const body = await context.req.json().catch(() => ({}));

  try {
    return context.json(await saveStoreSettings(body));
  } catch (error) {
    return context.json(
      { error: error instanceof Error ? error.message : "Settings save failed" },
      errorStatus(error),
    );
  }
});
