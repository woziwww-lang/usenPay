"use client";

import type { DashboardView } from "@usen-pay/domain";
import { checkoutTotal, currency, paymentSuccessRate, salesDelta } from "@usen-pay/domain";
import { KpiCard, VisitorChart } from "@usen-pay/ui";
import {
  Activity,
  Banknote,
  CircleDollarSign,
  RotateCw,
  Settings,
  Store,
  Table2,
  UsersRound,
  Wifi,
} from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { getApiMode, getDataSourceLabel } from "@/shared/api/endpoint-config";
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
  initialDashboard?: DashboardView;
};

export function DashboardClient({ initialDashboard }: Props) {
  const apiMode = getApiMode();
  const dataSourceLabel = getDataSourceLabel();
  const { data: dashboard, isFetching, isError, refetch } = useDashboardQuery(initialDashboard);
  const activeTable = useDashboardUiStore((state) => state.activeTable);
  const setActiveTable = useDashboardUiStore((state) => state.setActiveTable);
  const status = useDashboardUiStore((state) => state.status);
  const setStatus = useDashboardUiStore((state) => state.setStatus);
  const session = useAuthStore((state) => state.session);
  const can = useAuthStore((state) => state.can);
  const pushToast = useToastStore((state) => state.pushToast);
  const checkoutAction = useCheckoutActionMutation();
  const metrics = useMemo(() => {
    if (!dashboard) {
      return null;
    }

    const delta = salesDelta(dashboard.merchant.todaySales, dashboard.merchant.yesterdaySales);
    const availableTables = dashboard.tables.filter((table) => table.status === "available").length;
    return {
      checkout: checkoutTotal(dashboard.orders),
      delta,
      successRate: paymentSuccessRate(dashboard.transactions),
      availableTables,
    };
  }, [dashboard]);

  if (!dashboard && isError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-4 text-ink">
        <section className="w-full max-w-lg rounded-xl border border-red-200 bg-white p-6 shadow-panel">
          <p className="text-xs font-semibold uppercase text-red-600">API unavailable</p>
          <h1 className="mt-2 text-2xl font-semibold">Dashboard data could not be loaded.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Confirm the selected API mode is running, then retry the sync.
          </p>
          <button
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-slate-700 focus:ring-4 focus:ring-payblue/20"
            onClick={() => refetch()}
            type="button"
          >
            <RotateCw size={16} aria-hidden="true" />
            Retry sync
          </button>
        </section>
      </main>
    );
  }

  if (!dashboard) {
    return (
      <main className="min-h-screen bg-[#f4f7fb] px-4 py-6 text-ink">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {["Sales", "Checkout", "Visitors", "Tables", "Payments"].map((item) => (
              <div className="h-32 animate-pulse rounded-xl border border-line bg-white p-4" key={item}>
                <div className="h-3 w-20 rounded bg-slate-200" />
                <div className="mt-5 h-7 w-28 rounded bg-slate-200" />
                <div className="mt-4 h-3 w-32 rounded bg-slate-100" />
              </div>
            ))}
          </div>
          <section className="mt-5 rounded-xl border border-line bg-white p-6 shadow-panel">
            <p className="text-sm font-semibold text-slate-500">Loading operations console</p>
            <h1 className="mt-2 text-2xl font-semibold">Syncing table, checkout, and payment state.</h1>
          </section>
        </div>
      </main>
    );
  }

  if (!metrics) {
    return null;
  }

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

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-payblue text-white shadow-panel">
              <Store size={22} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                USEN PAY merchant console
              </p>
              <h1 className="truncate text-xl font-semibold tracking-tight text-ink">{merchant.name}</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <Link
              className="inline-flex items-center gap-2 rounded-lg bg-ink px-3 py-2 font-semibold text-white transition-colors duration-200 hover:bg-slate-700 focus:ring-4 focus:ring-payblue/20"
              to={routes.mypage}
            >
              <Settings size={16} aria-hidden="true" />
              MyPage
            </Link>
            <span className="rounded-lg border border-line bg-white px-3 py-2 font-medium">
              Plan: {merchant.plan}
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 font-medium">
              <Wifi size={16} className="text-mint" /> Terminal {merchant.terminalHealth}%
            </span>
            <span className="rounded-lg border border-line bg-white px-3 py-2 font-medium">
              BFF{" "}
              {new Date(dashboard.generatedAt).toLocaleTimeString("ja-JP", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="rounded-lg border border-line bg-white px-3 py-2 font-medium">
              API {isFetching ? "syncing" : isError ? "stale" : "live"}
            </span>
            <span
              className={`rounded-lg border px-3 py-2 font-semibold ${
                apiMode === "mock"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {dataSourceLabel}
            </span>
            {isError ? (
              <button
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 font-semibold text-red-700 transition-colors duration-200 hover:bg-red-100 focus:ring-4 focus:ring-red-100"
                onClick={() => refetch()}
                type="button"
              >
                <RotateCw size={15} aria-hidden="true" />
                Retry sync
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] gap-5 px-4 py-5 xl:grid-cols-[minmax(0,1fr)_360px] lg:px-6">
        <div className="min-w-0 space-y-5">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
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

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
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
          <section className="rounded-xl border border-line bg-white p-4 shadow-panel">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-ink">Ops recommendations</h2>
                <p className="text-sm text-slate-600">Attention points ranked by operational risk</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {dashboard.insights.map((insight) => (
                <article
                  key={insight.id}
                  className="rounded-lg border border-line bg-slate-50 p-3 transition-colors duration-200 hover:border-cyan/40 hover:bg-cyan/5"
                >
                  <p className="text-sm font-semibold text-ink">{insight.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{insight.description}</p>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
