import { dashboardFixture, dashboardSchema, type DashboardPayload } from "@usen-pay/domain";

export async function fetchMerchantDashboard(): Promise<DashboardPayload> {
  // Replace this adapter with Kotlin/Spring Boot, GraphQL, or event-store reads.
  return dashboardSchema.parse(dashboardFixture);
}
