import { getDashboardView } from "@/shared/api/bff-client";

export async function GET() {
  return Response.json(await getDashboardView());
}
