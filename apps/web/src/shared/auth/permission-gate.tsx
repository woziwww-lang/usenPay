"use client";

import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { useAuthStore } from "./auth-store";

type Props = {
  permission: string;
  children: ReactNode;
};

export function PermissionGate({ children, permission }: Props) {
  const can = useAuthStore((state) => state.can(permission));

  if (can) return children;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7fa] p-4 text-ink">
      <section className="w-full max-w-md rounded-lg border border-line bg-white p-5 text-center shadow-panel">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-amber-50 text-amber-700">
          <ShieldAlert size={24} aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-lg font-semibold">Permission required</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Manager settings require an owner or manager account. Sign in on the dashboard with owner.meguro or
          manager.meguro.
        </p>
      </section>
    </main>
  );
}
