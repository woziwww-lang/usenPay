import { useMutation, useQueryClient } from "@tanstack/react-query";
import { runCheckoutAction as postCheckoutAction } from "@/shared/api/api-client";
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
  return postCheckoutAction(checkoutId, action, body);
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
