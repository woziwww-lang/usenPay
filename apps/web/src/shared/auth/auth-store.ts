import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ManagerRole = "owner" | "manager" | "cashier";

export type ManagerSession = {
  managerId: string;
  name: string;
  role: ManagerRole;
  permissions: string[];
};

type AuthState = {
  session: ManagerSession | null;
  setSession: (session: ManagerSession) => void;
  logout: () => void;
  can: (permission: string) => boolean;
};

const memoryStorage = new Map<string, string>();

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      setSession: (session) => set({ session }),
      logout: () => set({ session: null }),
      can: (permission) => get().session?.permissions.includes(permission) ?? false,
    }),
    {
      name: "usen-pay-manager-session",
      partialize: (state) => ({ session: state.session }),
      storage: createJSONStorage(() =>
        typeof window === "undefined"
          ? {
              getItem: (name) => memoryStorage.get(name) ?? null,
              removeItem: (name) => {
                memoryStorage.delete(name);
              },
              setItem: (name, value) => {
                memoryStorage.set(name, value);
              },
            }
          : window.localStorage,
      ),
    },
  ),
);
