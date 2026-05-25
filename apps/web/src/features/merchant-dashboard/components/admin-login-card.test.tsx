import { describe, expect, it } from "vitest";
import { renderWithQueryClient } from "@/shared/test/render";
import { AdminLoginCard } from "./admin-login-card";

describe("AdminLoginCard", () => {
  it("renders the manager login form when locked", () => {
    const html = renderWithQueryClient(<AdminLoginCard />);

    expect(html).toContain("Manager login");
    expect(html).toContain("manager.meguro");
    expect(html).toContain("Sign in");
  });
});
