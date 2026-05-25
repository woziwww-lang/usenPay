import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { dashboardViewFixture } from "../testing/dashboard-fixture";
import { TableFloor } from "./table-floor";

describe("TableFloor", () => {
  it("renders table occupancy, customer numbers, and table amounts", () => {
    const html = renderToStaticMarkup(
      <TableFloor activeTable="A12" onSelectTable={vi.fn()} tables={dashboardViewFixture.tables} />,
    );

    expect(html).toContain("Table availability");
    expect(html).toContain("5/6");
    expect(html).toContain("A12");
    expect(html).toContain("G-238");
    expect(html).toContain("￥8,420");
    expect(html).toContain("ordering");
    expect(html).toContain("available");
  });
});
