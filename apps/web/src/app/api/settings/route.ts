import { backendFetch } from "@/shared/api/mock-backend";

export async function GET() {
  return backendFetch("/settings");
}

export async function PATCH(request: Request) {
  return backendFetch("/settings", {
    method: "PATCH",
    body: await request.json().catch(() => ({})),
  });
}
