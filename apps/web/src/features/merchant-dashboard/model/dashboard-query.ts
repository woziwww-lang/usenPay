import { useQuery } from "@tanstack/react-query";
import type { DashboardView } from "@usen-pay/domain";
import { getDashboard } from "@/shared/api/api-client";

export const dashboardQueryKey = ["merchant-dashboard"] as const;

export async function fetchDashboardView(): Promise<DashboardView> {
  return getDashboard();
}

export function useDashboardQuery(initialDashboard?: DashboardView) {
  return useQuery({
    queryKey: dashboardQueryKey,
    queryFn: fetchDashboardView,
    initialData: initialDashboard,
    refetchInterval: 10_000,
  });
}
