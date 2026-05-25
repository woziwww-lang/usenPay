import { backendFetch } from "@/shared/api/mock-backend";

export async function POST(request: Request) {
  return backendFetch("/auth/login", {
    method: "POST",
    body: await request.json().catch(() => ({})),
  });
}
