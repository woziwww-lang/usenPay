"use client";

import { LockKeyhole, LogIn, ShieldCheck } from "lucide-react";
import type { FormEvent } from "react";
import { useLoginManagerMutation } from "@/shared/auth/auth-api";
import { useAuthStore } from "@/shared/auth/auth-store";
import { useToastStore } from "@/shared/model/toast-store";

export function AdminLoginCard() {
  const session = useAuthStore((state) => state.session);
  const logout = useAuthStore((state) => state.logout);
  const login = useLoginManagerMutation();
  const pushToast = useToastStore((state) => state.pushToast);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const managerId = String(form.get("manager") || "manager.meguro");
    login.mutate(managerId, {
      onSuccess: (manager) => {
        pushToast({
          title: "Signed in",
          description: `${manager.name} (${manager.role})`,
          tone: "success",
        });
      },
    });
  }

  if (session) {
    return (
      <section className="rounded-lg border border-line bg-white p-4 shadow-panel">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-mint">
            <ShieldCheck size={20} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-slate-500">Administrator</p>
            <p className="truncate font-semibold text-ink">{session.name}</p>
            <p className="text-xs font-medium uppercase text-slate-500">{session.role}</p>
          </div>
        </div>
        <button
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          onClick={() => {
            logout();
            pushToast({ title: "Console locked", tone: "info" });
          }}
          type="button"
        >
          <LockKeyhole size={16} aria-hidden="true" />
          Lock console
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-panel">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-payblue">
          <LockKeyhole size={20} aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-ink">Manager login</h2>
          <p className="text-sm text-slate-600">Unlock checkout actions and settings.</p>
        </div>
      </div>
      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-xs font-semibold uppercase text-slate-500">Manager ID</span>
          <input
            className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-none ring-payblue/20 focus:ring-4"
            defaultValue="manager.meguro"
            name="manager"
          />
          <p className="mt-1 text-xs text-slate-500">Try owner.meguro, manager.meguro, or cashier.meguro.</p>
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase text-slate-500">Password</span>
          <input
            className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-none ring-payblue/20 focus:ring-4"
            defaultValue="demo-pass"
            name="password"
            type="password"
          />
        </label>
        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-payblue px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          disabled={login.isPending}
          type="submit"
        >
          <LogIn size={16} aria-hidden="true" />
          {login.isPending ? "Signing in" : "Sign in"}
        </button>
      </form>
    </section>
  );
}
