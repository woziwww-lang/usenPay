import { type DashboardView, dashboardViewSchema } from "@usen-pay/domain";
import {
  applyCheckoutDiscount,
  buildDashboardView,
  loginManager as fallbackLoginManager,
  getStoreSettings,
  issueReceipt,
  settleCheckout,
  splitCheckout,
  updateStoreSettings,
} from "./fallback-store";

type HttpMethod = "GET" | "POST" | "PATCH";

const coreApiBaseUrl = process.env.CORE_API_BASE_URL;

async function coreRequest<T>(
  path: string,
  options: { method?: HttpMethod; body?: unknown } = {},
): Promise<T> {
  if (!coreApiBaseUrl) {
    throw new Error("CORE_API_BASE_URL is not configured");
  }

  const response = await fetch(`${coreApiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      isErrorPayload(payload) && typeof payload.error === "string"
        ? payload.error
        : `Core API request failed: ${response.status}`;
    throw Object.assign(new Error(message), { status: response.status });
  }

  return payload as T;
}

export function errorStatus(error: unknown): 400 | 401 | 404 | 500 {
  if (
    typeof error !== "object" ||
    error === null ||
    !("status" in error) ||
    typeof error.status !== "number"
  ) {
    return 500;
  }

  return error.status === 400 || error.status === 401 || error.status === 404 ? error.status : 500;
}

function isErrorPayload(payload: unknown): payload is { error?: unknown } {
  return typeof payload === "object" && payload !== null && "error" in payload;
}

export async function fetchDashboardView(): Promise<DashboardView> {
  if (coreApiBaseUrl) {
    return dashboardViewSchema.parse(await coreRequest("/dashboard"));
  }

  return buildDashboardView();
}

export async function loginManager(managerId: string) {
  if (coreApiBaseUrl) {
    return coreRequest("/auth/login", { method: "POST", body: { managerId } });
  }

  const manager = fallbackLoginManager(managerId);
  if (!manager) throw Object.assign(new Error("Invalid manager account"), { status: 401 });
  return manager;
}

export async function fetchStoreSettings() {
  return coreApiBaseUrl ? coreRequest("/settings") : getStoreSettings();
}

export async function saveStoreSettings(body: unknown) {
  if (coreApiBaseUrl) {
    return coreRequest("/settings", { method: "PATCH", body });
  }

  return {
    settings: updateStoreSettings(body as Parameters<typeof updateStoreSettings>[0]),
    message: "Settings saved",
  };
}

export async function runCheckoutAction(
  checkoutId: string,
  action: "settle" | "split" | "discount" | "receipt",
  body?: unknown,
) {
  if (coreApiBaseUrl) {
    return coreRequest(`/checkout/${checkoutId}/${action}`, { method: "POST", body });
  }

  if (action === "settle") {
    const result = settleCheckout(checkoutId);
    if (!result) throw Object.assign(new Error("Checkout not found"), { status: 404 });
    return { ...result, message: `Checkout ${checkoutId} settled` };
  }

  if (action === "split") {
    const result = splitCheckout(
      checkoutId,
      body && typeof body === "object" && "parts" in body ? Number(body.parts) : 2,
    );
    if (!result) throw Object.assign(new Error("Checkout not found"), { status: 404 });
    return { ...result, message: `Split into ${result.parts} payments` };
  }

  if (action === "discount") {
    const result = applyCheckoutDiscount(
      checkoutId,
      body && typeof body === "object" && "amount" in body ? Number(body.amount) : 500,
    );
    if (!result) throw Object.assign(new Error("Checkout not found"), { status: 404 });
    return { ...result, message: `Discount applied to ${checkoutId}` };
  }

  const receipt = issueReceipt(checkoutId);
  if (!receipt) throw Object.assign(new Error("Checkout not found"), { status: 404 });
  return { receipt, message: `Receipt ${receipt.receiptNo} issued` };
}
