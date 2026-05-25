import type { OrderStatus } from "@usen-pay/domain";
import { create } from "zustand";

type DashboardUiState = {
  activeTable: string;
  status: OrderStatus | "all";
  setActiveTable: (tableId: string) => void;
  setStatus: (status: OrderStatus | "all") => void;
};

export const useDashboardUiStore = create<DashboardUiState>((set) => ({
  activeTable: "",
  status: "all",
  setActiveTable: (activeTable) => set({ activeTable }),
  setStatus: (status) => set({ status }),
}));
