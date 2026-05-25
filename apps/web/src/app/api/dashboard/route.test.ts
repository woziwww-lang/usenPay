import { describe, expect, it, vi } from "vitest";
import { dashboardViewFixture } from "@/features/merchant-dashboard/testing/dashboard-fixture";

vi.stubEnv("API_BASE_URL", "http://localhost:8790");

vi.mock("@/shared/api/bff-client", () => ({
  getDashboardView: vi.fn(async () => dashboardViewFixture),
}));

describe("dashboard API route", () => {
  it("returns BFF dashboard data for client-side TanStack Query", async () => {
    const route = await import("./route");
    const response = await route.GET();

    await expect(response.json()).resolves.toEqual(dashboardViewFixture);
  });
});
