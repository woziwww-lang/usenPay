import { afterEach, describe, expect, it } from "vitest";
import { useDashboardUiStore } from "./dashboard-ui-store";

describe("dashboard UI store", () => {
  afterEach(() => {
    useDashboardUiStore.setState({
      activeTable: "",
      status: "all",
    });
  });

  it("keeps POS UI state outside API cache", () => {
    useDashboardUiStore.getState().setActiveTable("B03");
    useDashboardUiStore.getState().setStatus("ready");

    expect(useDashboardUiStore.getState().activeTable).toBe("B03");
    expect(useDashboardUiStore.getState().status).toBe("ready");
  });
});
