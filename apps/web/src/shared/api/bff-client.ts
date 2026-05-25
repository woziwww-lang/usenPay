import { type DashboardView, dashboardViewSchema } from "@usen-pay/domain";
import { getApiBaseUrl } from "@/shared/config/server-env";

export async function getDashboardView(): Promise<DashboardView> {
  const response = await fetch(`${getApiBaseUrl()}/dashboard`, {
    next: { revalidate: 10 },
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`BFF request failed: ${response.status}`);
  }

  return dashboardViewSchema.parse(await response.json());
}
