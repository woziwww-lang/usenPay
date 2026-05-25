import { useQuery } from "@tanstack/react-query";
import { type DashboardView, dashboardViewSchema } from "@usen-pay/domain";

export const dashboardQueryKey = ["merchant-dashboard"] as const;

export async function fetchDashboardView(): Promise<DashboardView> {
  const response = await fetch("/api/dashboard", {
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Dashboard request failed: ${response.status}`);
  }

  return dashboardViewSchema.parse(await response.json());
}

export function useDashboardQuery(initialDashboard: DashboardView) {
  return useQuery({
    queryKey: dashboardQueryKey,
    queryFn: fetchDashboardView,
    initialData: initialDashboard,
    refetchInterval: 10_000,
  });
}
