import { afterEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/shared/auth/auth-store";
import { renderWithQueryClient } from "@/shared/test/render";
import { MyPageClient } from "./mypage-client";

describe("MyPageClient", () => {
  afterEach(() => {
    useAuthStore.setState({ session: null });
  });

  it("renders account, locale, discount, and review settings", () => {
    useAuthStore.setState({
      session: {
        managerId: "manager.meguro",
        name: "Manager Meguro",
        role: "manager",
        permissions: ["settings:write"],
      },
    });
    const html = renderWithQueryClient(<MyPageClient activeSection="security" />);

    expect(html).toContain("Store administration");
    expect(html).toContain("Security and account");
    expect(html).toContain('href="/mypage/language"');
    expect(html).toContain('href="/mypage/discounts"');
    expect(html).toContain('href="/mypage/reviews"');
    expect(html).toContain('href="/"');
  });

  it("renders a real section route for discounts", () => {
    useAuthStore.setState({
      session: {
        managerId: "manager.meguro",
        name: "Manager Meguro",
        role: "manager",
        permissions: ["settings:write"],
      },
    });
    const html = renderWithQueryClient(<MyPageClient activeSection="discounts" />);

    expect(html).toContain("Discount management");
    expect(html).toContain("Lunch repeat coupon");
  });

  it("renders a permission guard without settings permission", () => {
    const html = renderWithQueryClient(<MyPageClient activeSection="security" />);

    expect(html).toContain("Permission required");
  });
});
