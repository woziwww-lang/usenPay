import type { Table, TableStatus } from "@usen-pay/domain";
import { currency } from "@usen-pay/domain";
import { Armchair, BadgeJapaneseYen, Clock3, UsersRound } from "lucide-react";

type Props = {
  tables: Table[];
  activeTable: string;
  onSelectTable: (tableId: string) => void;
};

const statusTone: Record<TableStatus, string> = {
  available: "border-emerald-200 bg-emerald-50 text-emerald-800",
  seated: "border-blue-200 bg-blue-50 text-blue-800",
  ordering: "border-indigo-200 bg-indigo-50 text-indigo-800",
  checkout: "border-amber-200 bg-amber-50 text-amber-800",
  cleaning: "border-slate-200 bg-slate-100 text-slate-700",
  reserved: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800",
};

export function TableFloor({ tables, activeTable, onSelectTable }: Props) {
  const occupied = tables.filter((table) => table.status !== "available").length;
  const amount = tables.reduce((sum, table) => sum + table.amount, 0);

  return (
    <section className="rounded-lg border border-line bg-white shadow-panel">
      <div className="flex flex-col gap-3 border-b border-line p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink">Table availability</h2>
          <p className="text-sm text-slate-600">
            {occupied}/{tables.length} in use · open table amount {currency.format(amount)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm sm:flex">
          <span className="rounded-md bg-emerald-50 px-3 py-1.5 font-medium text-emerald-700">Available</span>
          <span className="rounded-md bg-amber-50 px-3 py-1.5 font-medium text-amber-700">Checkout</span>
        </div>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
        {tables.map((table) => (
          <button
            className={`rounded-lg border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-panel ${
              activeTable === table.id ? "border-payblue ring-4 ring-blue-100" : "border-line"
            }`}
            key={table.id}
            onClick={() => onSelectTable(table.id)}
            type="button"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-ink">{table.id}</p>
                <p className="text-xs font-medium text-slate-500">{table.zone}</p>
              </div>
              <span
                className={`rounded-md border px-2 py-1 text-xs font-semibold ${statusTone[table.status]}`}
              >
                {table.status}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1">
                <Armchair size={15} aria-hidden="true" />
                {table.seats} seats
              </span>
              <span className="inline-flex items-center gap-1">
                <UsersRound size={15} aria-hidden="true" />
                {table.customerNo ?? "open"}
              </span>
              <span className="inline-flex items-center gap-1">
                <BadgeJapaneseYen size={15} aria-hidden="true" />
                {currency.format(table.amount)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock3 size={15} aria-hidden="true" />
                {table.openedAt ?? "--:--"}
              </span>
            </div>
            <p className="mt-3 truncate text-xs text-slate-500">{table.lastAction}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
