import type { Order, OrderStatus } from "@usen-pay/domain";
import { currency } from "@usen-pay/domain";
import { StatusBadge } from "@usen-pay/ui";
import { Clock3, Users } from "lucide-react";

type Props = {
  orders: Order[];
  activeStatus: OrderStatus | "all";
  onStatusChange: (status: OrderStatus | "all") => void;
};

const statuses: Array<OrderStatus | "all"> = ["all", "new", "cooking", "ready", "served"];

export function OrderBoard({ orders, activeStatus, onStatusChange }: Props) {
  const visible = activeStatus === "all" ? orders : orders.filter((order) => order.status === activeStatus);

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-white shadow-panel">
      <div className="flex flex-col gap-3 border-b border-line p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-ink">Live order board</h2>
          <p className="text-sm text-slate-600">Kitchen, service, and checkout status</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => (
            <button
              key={status}
              className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors duration-200 focus:ring-4 focus:ring-payblue/20 ${
                activeStatus === status
                  ? "border-payblue bg-payblue text-white"
                  : "border-line bg-white text-slate-700 hover:bg-slate-50"
              }`}
              onClick={() => onStatusChange(status)}
              type="button"
            >
              {status === "all" ? "All" : status}
            </button>
          ))}
        </div>
      </div>
      <div className="divide-y divide-line">
        {visible.map((order) => (
          <article
            key={order.id}
            className="grid gap-3 p-4 transition-colors duration-200 hover:bg-slate-50 md:grid-cols-[minmax(0,1fr)_140px_120px] md:items-center"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-ink">{order.id}</h3>
                <StatusBadge value={order.status} />
              </div>
              <p className="mt-1 truncate text-sm text-slate-600">{order.items.join(" / ")}</p>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Users size={15} /> {order.table} / {order.guests}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock3 size={15} /> {order.openedAt} opened
                </span>
              </div>
            </div>
            <p className="text-right font-semibold text-ink md:text-left">{currency.format(order.amount)}</p>
            <p className="rounded-lg bg-slate-100 px-2 py-1 text-sm font-medium text-slate-600">
              {order.etaMinutes === 0 ? "No wait" : `${order.etaMinutes} min ETA`}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
