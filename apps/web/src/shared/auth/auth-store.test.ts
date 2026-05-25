import { afterEach, describe, expect, it } from "vitest";
import { useAuthStore } from "./auth-store";

describe("auth store", () => {
  afterEach(() => {
    useAuthStore.setState({ session: null });
  });

  it("tracks role permissions for protected actions", () => {
    useAuthStore.getState().setSession({
      managerId: "cashier.meguro",
      name: "Cashier Meguro",
      role: "cashier",
      permissions: ["checkout:settle", "receipt:issue"],
    });

    expect(useAuthStore.getState().can("checkout:settle")).toBe(true);
    expect(useAuthStore.getState().can("settings:write")).toBe(false);
  });

  it("clears the active manager session", () => {
    useAuthStore.getState().setSession({
      managerId: "manager.meguro",
      name: "Manager Meguro",
      role: "manager",
      permissions: ["settings:write"],
    });

    useAuthStore.getState().logout();

    expect(useAuthStore.getState().session).toBeNull();
  });
});
