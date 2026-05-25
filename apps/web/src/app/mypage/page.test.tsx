import { afterEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/shared/auth/auth-store";
import { renderWithQueryClient } from "@/shared/test/render";
import MyPage from "./page";

describe("mypage route", () => {
  afterEach(() => {
    useAuthStore.setState({ session: null });
  });

  it("renders the standalone MyPage application", () => {
    useAuthStore.setState({
      session: {
        managerId: "owner.meguro",
        name: "Owner Meguro",
        role: "owner",
        permissions: ["settings:write"],
      },
    });
    const html = renderWithQueryClient(<MyPage />);

    expect(html).toContain("MyPage micro frontend");
    expect(html).toContain("Store administration");
  });
});
