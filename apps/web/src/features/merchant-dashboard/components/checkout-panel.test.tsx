import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { dashboardViewFixture } from "../testing/dashboard-fixture";
import { CheckoutPanel } from "./checkout-panel";

describe("CheckoutPanel", () => {
  it("shows a selected table bill and locks actions before manager login", () => {
    const selectedTable = dashboardViewFixture.tables.find((table) => table.id === "A12");
    const html = renderToStaticMarkup(
      <CheckoutPanel
        canDiscount={true}
        checkouts={dashboardViewFixture.checkouts}
        isLocked={true}
        onDiscount={vi.fn()}
        onIssueReceipt={vi.fn()}
        onSettle={vi.fn()}
        onSplit={vi.fn()}
        selectedTable={selectedTable}
      />,
    );

    expect(html).toContain("A12");
    expect(html).toContain("G-238");
    expect(html).toContain("￥8,420");
    expect(html).toContain("Preferred tender: card");
    expect(html).toContain("Manager login is required");
    expect(html).toContain("disabled");
  });

  it("renders an empty state when no checkout requests exist", () => {
    const html = renderToStaticMarkup(
      <CheckoutPanel
        canDiscount={true}
        checkouts={[]}
        isLocked={false}
        onDiscount={vi.fn()}
        onIssueReceipt={vi.fn()}
        onSettle={vi.fn()}
        onSplit={vi.fn()}
      />,
    );

    expect(html).toContain("No active checkout requests.");
  });
});
