import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardQueryKey } from "./dashboard-query";

type CheckoutAction = "settle" | "split" | "discount" | "receipt";

type CheckoutActionInput = {
  checkoutId: string;
  action: CheckoutAction;
  body?: unknown;
};

export type CheckoutActionResult = {
  message: string;
  receipt?: {
    receiptNo: string;
    total: number;
  };
};

async function runCheckoutAction({
  action,
  body,
  checkoutId,
}: CheckoutActionInput): Promise<CheckoutActionResult> {
  const response = await fetch(`/api/checkout/${checkoutId}/${action}`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? `Checkout ${action} failed`);
  }

  return payload;
}

export function useCheckoutActionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: runCheckoutAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
    },
  });
}
