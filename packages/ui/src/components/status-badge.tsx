import { clsx } from "clsx";
import type { OrderStatus, PaymentStatus } from "@usen-pay/domain";

type Props = {
  value: OrderStatus | PaymentStatus | string;
};

const labels: Record<string, string> = {
  new: "New",
  cooking: "Cooking",
  ready: "Ready",
  served: "Served",
  paid: "Paid",
  settled: "Settled",
  authorized: "Authorized",
  failed: "Failed",
  refunding: "Refunding"
};

export function StatusBadge({ value }: Props) {
  return (
    <span
      className={clsx(
        "inline-flex h-6 items-center rounded px-2 text-xs font-semibold",
        (value === "settled" || value === "ready" || value === "paid") && "bg-emerald-100 text-emerald-800",
        (value === "authorized" || value === "cooking" || value === "served") && "bg-blue-100 text-blue-800",
        (value === "failed" || value === "new") && "bg-rose-100 text-rose-800",
        value === "refunding" && "bg-amber-100 text-amber-800"
      )}
    >
      {labels[value] ?? value}
    </span>
  );
}
