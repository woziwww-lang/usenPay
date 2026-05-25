import { afterEach, describe, expect, it, vi } from "vitest";
import { dashboardViewFixture } from "../testing/dashboard-fixture";
import { dashboardQueryKey, fetchDashboardView } from "./dashboard-query";

describe("dashboard query API", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses a stable query key for dashboard server state", () => {
    expect(dashboardQueryKey).toEqual(["merchant-dashboard"]);
  });

  it("fetches and validates dashboard data from the Next API proxy", async () => {
    const fetchMock = vi.fn(async () => Response.json(dashboardViewFixture));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchDashboardView()).resolves.toEqual(dashboardViewFixture);
    expect(fetchMock).toHaveBeenCalledWith("/api/dashboard", {
      headers: {
        accept: "application/json",
      },
    });
  });

  it("throws when the dashboard API returns an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 500 })),
    );

    await expect(fetchDashboardView()).rejects.toThrow("Dashboard request failed: 500");
  });
});
