"use client";

import type { DashboardView } from "@usen-pay/domain";
import { checkoutTotal, currency, paymentSuccessRate, salesDelta } from "@usen-pay/domain";
import { KpiCard, VisitorChart } from "@usen-pay/ui";
import {
  Activity,
  Banknote,
  CircleDollarSign,
  Settings,
  Store,
  Table2,
  UsersRound,
  Wifi,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useAuthStore } from "@/shared/auth/auth-store";
import { routes } from "@/shared/config/routes";
import { useToastStore } from "@/shared/model/toast-store";
import { AdminLoginCard } from "./components/admin-login-card";
import { CheckoutPanel } from "./components/checkout-panel";
import { OrderBoard } from "./components/order-board";
import { PaymentTable } from "./components/payment-table";
import { TableFloor } from "./components/table-floor";
import { useCheckoutActionMutation } from "./model/checkout-actions";
import { useDashboardQuery } from "./model/dashboard-query";
import { useDashboardUiStore } from "./model/dashboard-ui-store";

type Props = {
  initialDashboard: DashboardView;
};

export function DashboardClient({ initialDashboard }: Props) {
  const apiMode = process.env.NEXT_PUBLIC_API_MODE === "mock" ? "mock" : "live";
  const { data: dashboard, isFetching, isError } = useDashboardQuery(initialDashboard);
  const activeTable = useDashboardUiStore((state) => state.activeTable);
  const setActiveTable = useDashboardUiStore((state) => state.setActiveTable);
  const status = useDashboardUiStore((state) => state.status);
  const setStatus = useDashboardUiStore((state) => state.setStatus);
  const session = useAuthStore((state) => state.session);
  const can = useAuthStore((state) => state.can);
  const pushToast = useToastStore((state) => state.pushToast);
  const checkoutAction = useCheckoutActionMutation();
  const merchant = dashboard.merchant;
  const isAuthenticated = Boolean(session);
  const activeTableId = activeTable || dashboard.tables[0]?.id || "";
  const selectedTable = dashboard.tables.find((table) => table.id === activeTableId);

  function runCheckoutAction(
    checkoutId: string,
    action: "settle" | "split" | "discount" | "receipt",
    permission: string,
    body?: unknown,
  ) {
    if (!can(permission)) {
      pushToast({
        title: "Permission denied",
        description: `${session?.role ?? "Guest"} cannot run ${action}.`,
        tone: "error",
      });
      return;
    }

    checkoutAction.mutate(
      { checkoutId, action, body },
      {
        onSuccess: (result) => {
          pushToast({
            title: result.message,
            description: result.receipt ? `Receipt ${result.receipt.receiptNo}` : undefined,
            tone: "success",
          });
        },
      },
    );
  }

  const metrics = useMemo(() => {
    const delta = salesDelta(merchant.todaySales, merchant.yesterdaySales);
    const availableTables = dashboard.tables.filter((table) => table.status === "available").length;
    return {
      checkout: checkoutTotal(dashboard.orders),
      delta,
      successRate: paymentSuccessRate(dashboard.transactions),
      availableTables,
    };
  }, [
    dashboard.orders,
    dashboard.tables,
    dashboard.transactions,
    merchant.todaySales,
    merchant.yesterdaySales,
  ]);

  return (
    <main className="min-h-screen bg-[#f5f7fa] text-ink">
      <header className="sticky top-0 z-10 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-payblue text-white">
              <Store size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">USEN PAY merchant console</p>
              <h1 className="text-xl font-semibold text-ink">{merchant.name}</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <Link
              className="inline-flex items-center gap-2 rounded-md bg-ink px-3 py-1.5 font-semibold text-white hover:bg-slate-700"
              href={routes.mypage}
            >
              <Settings size={16} aria-hidden="true" />
              MyPage
            </Link>
            <span className="rounded-md border border-line bg-slate-50 px-3 py-1.5">
              Plan: {merchant.plan}
            </span>
            <span className="inline-flex items-center gap-2 rounded-md border border-line bg-slate-50 px-3 py-1.5">
              <Wifi size={16} className="text-mint" /> Terminal {merchant.terminalHealth}%
            </span>
            <span className="rounded-md border border-line bg-slate-50 px-3 py-1.5">
              BFF{" "}
              {new Date(dashboard.generatedAt).toLocaleTimeString("ja-JP", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="rounded-md border border-line bg-slate-50 px-3 py-1.5">
              API {isFetching ? "syncing" : isError ? "stale" : "live"}
            </span>
            <span
              className={`rounded-md border px-3 py-1.5 font-semibold ${
                apiMode === "mock"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {apiMode === "mock" ? "Mock API" : "Spring API"}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 lg:grid-cols-[1fr_320px] lg:px-6">
        <div className="space-y-5">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <KpiCard
              icon={CircleDollarSign}
              label="Today's sales"
              value={currency.format(merchant.todaySales)}
              meta={`${metrics.delta > 0 ? "+" : ""}${metrics.delta}% vs yesterday`}
            />
            <KpiCard
              icon={Banknote}
              label="Checkout queue"
              value={currency.format(metrics.checkout)}
              meta={`${merchant.queueLength} groups waiting`}
            />
            <KpiCard
              icon={UsersRound}
              label="Visitors"
              value={`${merchant.visitorCount}`}
              meta={`${merchant.activeTables} active tables`}
            />
            <KpiCard
              icon={Table2}
              label="Open tables"
              value={`${metrics.availableTables}/${dashboard.tables.length}`}
              meta={`${dashboard.tables.length - metrics.availableTables} occupied or reserved`}
            />
            <KpiCard
              icon={Activity}
              label="Payment success"
              value={`${metrics.successRate}%`}
              meta="Settled or authorized payments"
            />
          </section>

          <TableFloor tables={dashboard.tables} activeTable={activeTableId} onSelectTable={setActiveTable} />
          <OrderBoard orders={dashboard.orders} activeStatus={status} onStatusChange={setStatus} />
          <PaymentTable transactions={dashboard.transactions} />
        </div>

        <aside className="space-y-5">
          <AdminLoginCard />
          <CheckoutPanel
            canDiscount={can("checkout:discount")}
            checkouts={dashboard.checkouts}
            isBusy={checkoutAction.isPending}
            isLocked={!isAuthenticated}
            onDiscount={(checkoutId) =>
              runCheckoutAction(checkoutId, "discount", "checkout:discount", { amount: 500 })
            }
            onIssueReceipt={(checkoutId) => runCheckoutAction(checkoutId, "receipt", "receipt:issue")}
            onSettle={(checkoutId) => runCheckoutAction(checkoutId, "settle", "checkout:settle")}
            onSplit={(checkoutId) => runCheckoutAction(checkoutId, "split", "checkout:settle", { parts: 2 })}
            selectedTable={selectedTable}
          />
          <VisitorChart points={dashboard.visitors} />
          <section className="rounded-lg border border-line bg-white p-4 shadow-panel">
            <h2 className="text-base font-semibold text-ink">Ops recommendations</h2>
            <div className="mt-4 space-y-3">
              {dashboard.insights.map((insight) => (
                <article key={insight.id} className="rounded-md border border-line bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-ink">{insight.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{insight.description}</p>
                </article>
              ))}
            </div>
          </section>
          <section className="rounded-lg border border-line bg-white p-4 shadow-panel">
            <h2 className="text-base font-semibold text-ink">Console modules</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              {["POS", "Tables", "Checkout", "Payments", "Orders", "MyPage", "BFF", "Zod contracts"].map(
                (item) => (
                  <span key={item} className="rounded-md bg-slate-100 px-3 py-2 font-medium text-slate-700">
                    {item}
                  </span>
                ),
              )}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
