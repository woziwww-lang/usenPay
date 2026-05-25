import type { DashboardPayload, OpsInsight, Order, Transaction, VisitorPoint } from "./contracts";

export const currency = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

export function salesDelta(today: number, yesterday: number) {
  if (yesterday === 0) return 0;
  return Math.round(((today - yesterday) / yesterday) * 1000) / 10;
}

export function checkoutTotal(orders: Order[]) {
  return orders.filter((order) => order.status !== "paid").reduce((sum, order) => sum + order.amount, 0);
}

export function paymentSuccessRate(transactions: Transaction[]) {
  if (transactions.length === 0) return 0;
  const good = transactions.filter((item) => item.status === "settled" || item.status === "authorized");
  return Math.round((good.length / transactions.length) * 100);
}

export function peakVisitorWindow(points: VisitorPoint[]) {
  const first = points[0];
  if (!first) {
    return { time: "-", visitors: 0, seats: 0, checkoutWait: 0 };
  }
  return points.reduce((peak, point) => (point.visitors > peak.visitors ? point : peak), first);
}

export function buildOpsInsights(payload: DashboardPayload): OpsInsight[] {
  const failed = payload.transactions.filter((transaction) => transaction.status === "failed");
  const lateOrders = payload.orders.filter((order) => order.etaMinutes > 10);
  const peak = peakVisitorWindow(payload.visitors);

  return [
    {
      id: "payment-risk",
      severity: failed.length > 0 ? "critical" : "info",
      title: failed.length > 0 ? "Payment retry needed" : "Payments are stable",
      description:
        failed.length > 0
          ? `${failed.length}件の決済失敗があります。端末・ブランド別の再試行導線を確認してください。`
          : "決済成功率は安定しています。",
    },
    {
      id: "kitchen-latency",
      severity: lateOrders.length > 0 ? "warning" : "info",
      title: lateOrders.length > 0 ? "Kitchen queue is heating up" : "Kitchen queue is healthy",
      description:
        lateOrders.length > 0
          ? `${lateOrders.length}件の注文が10分超の待ち時間です。キッチン優先度を調整してください。`
          : "調理待ちの遅延はありません。",
    },
    {
      id: "visitor-peak",
      severity: "info",
      title: "Visitor peak window",
      description: `${peak.time} が客流ピークです。会計待ち ${peak.checkoutWait} 分を基準にレジ人員を調整できます。`,
    },
  ];
}
