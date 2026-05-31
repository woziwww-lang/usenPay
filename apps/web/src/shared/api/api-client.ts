import type { DashboardView } from "@usen-pay/domain";
import { dashboardViewSchema } from "@usen-pay/domain";
import { requestJson } from "./http";

export type StoreSettings = {
  language: string;
  currency: string;
  approvalLimit: string;
  notifications: Record<string, boolean>;
  discountRules: Array<{ name: string; target: string; value: string }>;
  reviewRules: Array<{ channel: string; state: string; score: string }>;
};

export type CheckoutAction = "settle" | "split" | "discount" | "receipt";

export type CheckoutActionResult = {
  message: string;
  receipt?: {
    receiptNo: string;
    total: number;
  };
};

export async function getDashboard(): Promise<DashboardView> {
  return dashboardViewSchema.parse(await requestJson<unknown>("/api/dashboard"));
}

export async function runCheckoutAction(
  checkoutId: string,
  action: CheckoutAction,
  body?: unknown,
): Promise<CheckoutActionResult> {
  return requestJson<CheckoutActionResult>(`/api/checkout/${checkoutId}/${action}`, {
    method: "POST",
    body,
  });
}

export async function getStoreSettings(): Promise<StoreSettings> {
  return requestJson<StoreSettings>("/api/settings");
}

export async function saveStoreSettings(
  settings: StoreSettings,
): Promise<{ settings: StoreSettings; message: string }> {
  return requestJson<{ settings: StoreSettings; message: string }>("/api/settings", {
    method: "PATCH",
    body: settings,
  });
}
