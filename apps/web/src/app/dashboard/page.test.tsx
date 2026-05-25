import { describe, expect, it, vi } from "vitest";
import { dashboardViewFixture } from "@/features/merchant-dashboard/testing/dashboard-fixture";
import { renderWithQueryClient } from "@/shared/test/render";

vi.mock("@/shared/api/bff-client", () => ({
  getDashboardView: vi.fn(async () => dashboardViewFixture),
}));

describe("dashboard route", () => {
  it("is runtime-rendered and renders the POS dashboard from BFF data", async () => {
    const pageModule = await import("./page");
    const element = await pageModule.default();
    const html = renderWithQueryClient(element);

    expect(pageModule.dynamic).toBe("force-dynamic");
    expect(html).toContain("MEGURO KITCHEN LAB");
    expect(html).toContain("Table availability");
    expect(html).toContain("Manager login");
  });
});
