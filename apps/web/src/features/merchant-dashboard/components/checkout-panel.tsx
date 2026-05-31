import type { Checkout, PaymentMethod, Table } from "@usen-pay/domain";
import { currency } from "@usen-pay/domain";
import {
  BadgePercent,
  Banknote,
  CreditCard,
  GitBranch,
  QrCode,
  ReceiptText,
  ShieldAlert,
  TrainFront,
  WalletCards,
} from "lucide-react";

type Props = {
  checkouts: Checkout[];
  selectedTable?: Table;
  isLocked: boolean;
  canDiscount: boolean;
  isBusy?: boolean;
  onDiscount: (checkoutId: string) => void;
  onIssueReceipt: (checkoutId: string) => void;
  onSettle: (checkoutId: string) => void;
  onSplit: (checkoutId: string) => void;
};

const methodIcon: Record<PaymentMethod, typeof CreditCard> = {
  card: CreditCard,
  qr: QrCode,
  transport: TrainFront,
  cash: WalletCards,
};

export function CheckoutPanel({
  canDiscount,
  checkouts,
  isBusy,
  isLocked,
  onDiscount,
  onIssueReceipt,
  onSettle,
  onSplit,
  selectedTable,
}: Props) {
  const activeCheckout = checkouts.find((checkout) => checkout.table === selectedTable?.id) ?? checkouts[0];

  if (!activeCheckout) {
    return (
      <section className="rounded-xl border border-line bg-white p-4 shadow-panel">
        <h2 className="text-base font-semibold tracking-tight text-ink">Checkout</h2>
        <p className="mt-1 text-sm text-slate-600">No active checkout requests.</p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-white shadow-panel">
      <div className="border-b border-line p-4">
        <div className="flex items-center gap-2">
          <ReceiptText size={19} className="text-payblue" aria-hidden="true" />
          <h2 className="text-base font-semibold tracking-tight text-ink">Checkout</h2>
        </div>
        <p className="mt-1 text-sm text-slate-600">Table bill, discount, tax, and tender status</p>
      </div>

      <div className="p-4">
        <div className="rounded-xl border border-line bg-slate-50 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Selected</p>
              <p className="mt-1 text-lg font-semibold text-ink">
                {selectedTable?.id ?? activeCheckout.table} ·{" "}
                {selectedTable?.customerNo ?? activeCheckout.customerNo}
              </p>
            </div>
            <span className="rounded-lg bg-white px-2 py-1 text-xs font-semibold text-slate-600">
              {activeCheckout.status}
            </span>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Subtotal</dt>
              <dd className="font-medium text-ink">{currency.format(activeCheckout.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Tax</dt>
              <dd className="font-medium text-ink">{currency.format(activeCheckout.tax)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Discount</dt>
              <dd className="font-medium text-coral">-{currency.format(activeCheckout.discount)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-base">
              <dt className="font-semibold text-ink">Total</dt>
              <dd className="font-semibold text-ink">{currency.format(activeCheckout.total)}</dd>
            </div>
          </dl>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700">
            {(() => {
              const Icon = methodIcon[activeCheckout.method];
              return <Icon size={17} aria-hidden="true" />;
            })()}
            Preferred tender: {activeCheckout.method}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            className="col-span-2 inline-flex items-center justify-center gap-2 rounded-lg bg-payblue px-3 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700 focus:ring-4 focus:ring-payblue/20 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={isLocked || isBusy}
            onClick={() => onSettle(activeCheckout.id)}
            type="button"
          >
            <Banknote size={16} aria-hidden="true" />
            {isBusy ? "Processing" : "Settle bill"}
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:border-cyan/50 hover:bg-cyan/5 focus:ring-4 focus:ring-payblue/20 disabled:cursor-not-allowed disabled:text-slate-400"
            disabled={isLocked || isBusy}
            onClick={() => onSplit(activeCheckout.id)}
            type="button"
          >
            <GitBranch size={15} aria-hidden="true" />
            Split
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:border-cyan/50 hover:bg-cyan/5 focus:ring-4 focus:ring-payblue/20 disabled:cursor-not-allowed disabled:text-slate-400"
            disabled={isLocked || !canDiscount || isBusy}
            onClick={() => onDiscount(activeCheckout.id)}
            type="button"
          >
            <BadgePercent size={15} aria-hidden="true" />
            Discount
          </button>
          <button
            className="col-span-2 inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:border-cyan/50 hover:bg-cyan/5 focus:ring-4 focus:ring-payblue/20 disabled:cursor-not-allowed disabled:text-slate-400"
            disabled={isLocked || isBusy}
            onClick={() => onIssueReceipt(activeCheckout.id)}
            type="button"
          >
            <ReceiptText size={15} aria-hidden="true" />
            Receipt
          </button>
        </div>
        {isLocked ? (
          <p className="mt-3 inline-flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
            <ShieldAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            Manager login is required for checkout actions.
          </p>
        ) : null}
        {!isLocked && !canDiscount ? (
          <p className="mt-3 text-sm text-slate-500">
            Cashier role can settle and issue receipts. Discount requires manager.
          </p>
        ) : null}
      </div>
    </section>
  );
}
