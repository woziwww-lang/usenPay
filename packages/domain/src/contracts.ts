import { z } from "zod";

export const paymentMethodSchema = z.enum(["card", "qr", "transport", "cash"]);
export const paymentStatusSchema = z.enum(["settled", "authorized", "failed", "refunding"]);
export const orderStatusSchema = z.enum(["new", "cooking", "ready", "served", "paid"]);
export const tableStatusSchema = z.enum([
  "available",
  "seated",
  "ordering",
  "checkout",
  "cleaning",
  "reserved",
]);

export const merchantSchema = z.object({
  id: z.string(),
  name: z.string(),
  plan: z.enum(["Standard", "Growth", "Enterprise"]),
  terminalHealth: z.number().min(0).max(100),
  todaySales: z.number().nonnegative(),
  yesterdaySales: z.number().nonnegative(),
  activeTables: z.number().int().nonnegative(),
  queueLength: z.number().int().nonnegative(),
  visitorCount: z.number().int().nonnegative(),
});

export const orderSchema = z.object({
  id: z.string(),
  table: z.string(),
  guests: z.number().int().positive(),
  items: z.array(z.string()),
  status: orderStatusSchema,
  amount: z.number().nonnegative(),
  openedAt: z.string(),
  etaMinutes: z.number().int().nonnegative(),
});

export const tableSchema = z.object({
  id: z.string(),
  zone: z.string(),
  seats: z.number().int().positive(),
  status: tableStatusSchema,
  customerNo: z.string().nullable(),
  orderId: z.string().nullable(),
  amount: z.number().nonnegative(),
  openedAt: z.string().nullable(),
  lastAction: z.string(),
});

export const checkoutSchema = z.object({
  id: z.string(),
  table: z.string(),
  customerNo: z.string(),
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative(),
  discount: z.number().nonnegative(),
  total: z.number().nonnegative(),
  method: paymentMethodSchema,
  status: z.enum(["draft", "ready", "processing", "paid"]),
  requestedAt: z.string(),
});

export const transactionSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  method: paymentMethodSchema,
  status: paymentStatusSchema,
  amount: z.number().nonnegative(),
  brand: z.string(),
  capturedAt: z.string(),
  riskScore: z.number().min(0).max(100),
});

export const visitorPointSchema = z.object({
  time: z.string(),
  visitors: z.number().int().nonnegative(),
  seats: z.number().int().nonnegative(),
  checkoutWait: z.number().int().nonnegative(),
});

export const dashboardSchema = z.object({
  merchant: merchantSchema,
  orders: z.array(orderSchema),
  tables: z.array(tableSchema),
  checkouts: z.array(checkoutSchema),
  transactions: z.array(transactionSchema),
  visitors: z.array(visitorPointSchema),
});

export const opsInsightSchema = z.object({
  id: z.string(),
  severity: z.enum(["info", "warning", "critical"]),
  title: z.string(),
  description: z.string(),
});

export const dashboardViewSchema = dashboardSchema.extend({
  insights: z.array(opsInsightSchema),
  generatedAt: z.string(),
});

export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type TableStatus = z.infer<typeof tableStatusSchema>;
export type Merchant = z.infer<typeof merchantSchema>;
export type Order = z.infer<typeof orderSchema>;
export type Table = z.infer<typeof tableSchema>;
export type Checkout = z.infer<typeof checkoutSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type VisitorPoint = z.infer<typeof visitorPointSchema>;
export type DashboardPayload = z.infer<typeof dashboardSchema>;
export type OpsInsight = z.infer<typeof opsInsightSchema>;
export type DashboardView = z.infer<typeof dashboardViewSchema>;
