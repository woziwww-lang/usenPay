import { describe, expect, it } from "vitest";
import { dashboardFixture } from "./fixtures";
import { checkoutTotal, paymentSuccessRate, salesDelta } from "./metrics";

describe("merchant metrics", () => {
  it("calculates sales delta", () => {
    expect(salesDelta(110, 100)).toBe(10);
  });

  it("sums unpaid order checkout total", () => {
    expect(checkoutTotal(dashboardFixture.orders)).toBe(20370);
  });

  it("tracks authorized and settled payments as successful", () => {
    expect(paymentSuccessRate(dashboardFixture.transactions)).toBe(50);
  });
});
