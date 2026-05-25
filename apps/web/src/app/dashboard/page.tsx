import { DashboardClient } from "@/features/merchant-dashboard";
import { getDashboardView } from "@/shared/api/bff-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const dashboard = await getDashboardView();
  return <DashboardClient initialDashboard={dashboard} />;
}
