import type { PaymentMethod, Transaction } from "@usen-pay/domain";
import { currency } from "@usen-pay/domain";
import { StatusBadge } from "@usen-pay/ui";
import { CreditCard, QrCode, TrainFront, WalletCards } from "lucide-react";

type Props = {
  transactions: Transaction[];
};

const methodIcon: Record<PaymentMethod, typeof CreditCard> = {
  card: CreditCard,
  qr: QrCode,
  transport: TrainFront,
  cash: WalletCards,
};

export function PaymentTable({ transactions }: Props) {
  return (
    <section className="rounded-lg border border-line bg-white shadow-panel">
      <div className="border-b border-line p-4">
        <h2 className="text-base font-semibold text-ink">Payment monitor</h2>
        <p className="text-sm text-slate-600">Brand, status, capture, and risk signal</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {transactions.map((transaction) => {
              const Icon = methodIcon[transaction.method];
              return (
                <tr key={transaction.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{transaction.id}</p>
                    <p className="text-xs text-slate-500">
                      {transaction.orderId} at {transaction.capturedAt}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 text-slate-700">
                      <Icon size={17} /> {transaction.brand}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={transaction.status} />
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink">{currency.format(transaction.amount)}</td>
                  <td className="px-4 py-3">
                    <div className="h-2 w-24 rounded bg-slate-100">
                      <div
                        className={`h-2 rounded ${transaction.riskScore > 50 ? "bg-coral" : "bg-mint"}`}
                        style={{ width: `${transaction.riskScore}%` }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
