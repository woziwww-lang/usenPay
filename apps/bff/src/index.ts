import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { dashboardRoute } from "./routes/dashboard";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    allowMethods: ["GET", "OPTIONS"]
  })
);

app.get("/health", (context) => context.json({ ok: true, service: "usen-pay-bff" }));
app.route("/dashboard", dashboardRoute);

const port = Number(process.env.PORT ?? 8787);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`USEN PAY BFF listening on http://localhost:${info.port}`);
});

export type BffApp = typeof app;
