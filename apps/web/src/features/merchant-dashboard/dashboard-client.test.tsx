import { describe, expect, it } from "vitest";
import { renderWithQueryClient } from "@/shared/test/render";
import { DashboardClient } from "./dashboard-client";
import { dashboardViewFixture } from "./testing/dashboard-fixture";

describe("DashboardClient", () => {
  it("renders the expanded POS dashboard modules", () => {
    const html = renderWithQueryClient(<DashboardClient initialDashboard={dashboardViewFixture} />);

    expect(html).toContain("MEGURO KITCHEN LAB");
    expect(html).toContain("Table availability");
    expect(html).toContain("Checkout");
    expect(html).toContain("Manager login");
    expect(html).toContain("Open tables");
    expect(html).toContain("1/6");
    expect(html).toContain('href="/mypage"');
    expect(html).toContain("G-238");
  });
});
