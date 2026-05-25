import {
  buildOpsInsights,
  type Checkout,
  type DashboardPayload,
  type DashboardView,
  dashboardFixture,
  dashboardSchema,
  dashboardViewSchema,
  type Table,
} from "@usen-pay/domain";

const activeDashboard: DashboardPayload = structuredClone(dashboardFixture);

type ManagerRole = "owner" | "manager" | "cashier";

type Manager = {
  name: string;
  role: ManagerRole;
  permissions: string[];
};

type StoreSettings = {
  language: string;
  currency: string;
  approvalLimit: string;
  notifications: Record<string, boolean>;
  discountRules: Array<{ name: string; target: string; value: string }>;
  reviewRules: Array<{ channel: string; state: string; score: string }>;
};

const managers: Record<string, Manager> = {
  "owner.meguro": {
    name: "Owner Meguro",
    role: "owner",
    permissions: ["checkout:settle", "checkout:discount", "settings:write", "receipt:issue"],
  },
  "manager.meguro": {
    name: "Manager Meguro",
    role: "manager",
    permissions: ["checkout:settle", "checkout:discount", "settings:write", "receipt:issue"],
  },
  "cashier.meguro": {
    name: "Cashier Meguro",
    role: "cashier",
    permissions: ["checkout:settle", "receipt:issue"],
  },
};

let storeSettings: StoreSettings = {
  language: "日本語",
  currency: "JPY - Japanese Yen",
  approvalLimit: "Discounts over 15%",
  notifications: {
    "Payment failures": true,
    "Review below 3 stars": true,
    "Cash drawer variance": true,
  },
  discountRules: [
    { name: "Lunch repeat coupon", target: "Weekday 11:00-14:00", value: "5%" },
    { name: "Student QR campaign", target: "QR payment", value: "8%" },
    { name: "Staff approval limit", target: "Manual discount", value: "15%" },
  ],
  reviewRules: [
    { channel: "Google Business", state: "Auto request after settled payment", score: "4.6" },
    { channel: "In-store survey", state: "Show QR on receipt", score: "4.3" },
    { channel: "Complaint routing", state: "Manager notification enabled", score: "SLA 15m" },
  ],
};

export function buildDashboardView(): DashboardView {
  const dashboard = dashboardSchema.parse(activeDashboard);

  return dashboardViewSchema.parse({
    ...dashboard,
    insights: buildOpsInsights(dashboard),
    generatedAt: new Date().toISOString(),
  });
}

export function loginManager(managerId: string) {
  const manager = managers[managerId];
  return manager ? { managerId, ...manager } : null;
}

export function getStoreSettings() {
  return storeSettings;
}

export function updateStoreSettings(nextSettings: Partial<StoreSettings>) {
  storeSettings = {
    ...storeSettings,
    ...nextSettings,
    notifications: {
      ...storeSettings.notifications,
      ...nextSettings.notifications,
    },
  };

  return storeSettings;
}

export function settleCheckout(checkoutId: string) {
  const checkout = findCheckout(checkoutId);
  if (!checkout) return null;

  checkout.status = "paid";
  activeDashboard.orders = activeDashboard.orders.map((order) =>
    order.table === checkout.table || order.id === checkout.id ? { ...order, status: "paid" } : order,
  );
  activeDashboard.tables = activeDashboard.tables.map((table) =>
    table.id === checkout.table
      ? {
          ...table,
          status: "cleaning",
          amount: 0,
          customerNo: null,
          orderId: null,
          lastAction: "Payment settled",
        }
      : table,
  );
  activeDashboard.transactions = [
    {
      id: `PAY-${Date.now().toString().slice(-5)}`,
      orderId: checkout.id,
      method: checkout.method,
      status: "settled",
      amount: checkout.total,
      brand: checkout.method === "card" ? "Visa" : checkout.method === "qr" ? "PayPay" : checkout.method,
      capturedAt: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
      riskScore: 6,
    },
    ...activeDashboard.transactions,
  ];

  return { checkout, dashboard: buildDashboardView() };
}

export function splitCheckout(checkoutId: string, parts = 2) {
  const checkout = findCheckout(checkoutId);
  if (!checkout) return null;

  const normalizedParts = Math.max(2, parts);
  checkout.status = "ready";

  return {
    checkout,
    parts: normalizedParts,
    splitAmount: Math.ceil(checkout.total / normalizedParts),
  };
}

export function applyCheckoutDiscount(checkoutId: string, amount = 500) {
  const checkout = findCheckout(checkoutId);
  if (!checkout) return null;

  const normalizedAmount = Math.max(0, amount);
  checkout.discount += normalizedAmount;
  checkout.total = Math.max(0, checkout.subtotal + checkout.tax - checkout.discount);
  syncTableAmount(checkout);

  return { checkout, dashboard: buildDashboardView() };
}

export function issueReceipt(checkoutId: string) {
  const checkout = findCheckout(checkoutId);
  if (!checkout) return null;

  return {
    receiptNo: `RCT-${Date.now().toString().slice(-6)}`,
    checkoutId,
    table: checkout.table,
    total: checkout.total,
    issuedAt: new Date().toISOString(),
  };
}

function findCheckout(checkoutId: string): Checkout | undefined {
  return activeDashboard.checkouts.find((checkout) => checkout.id === checkoutId);
}

function syncTableAmount(checkout: Checkout) {
  activeDashboard.tables = activeDashboard.tables.map(
    (table): Table =>
      table.id === checkout.table
        ? {
            ...table,
            amount: checkout.total,
            lastAction: "Discount applied",
          }
        : table,
  );
}
