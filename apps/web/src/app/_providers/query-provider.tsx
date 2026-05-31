"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";
import { useToastStore } from "@/shared/model/toast-store";
import { ToastViewport } from "@/shared/ui/toast-viewport";

type Props = {
  children: ReactNode;
};

export function QueryProvider({ children }: Props) {
  const pushToast = useToastStore((state) => state.pushToast);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          mutations: {
            onError: (error) => {
              pushToast({
                title: "Action failed",
                description: error instanceof Error ? error.message : "Please try again.",
                tone: "error",
              });
            },
          },
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 10_000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ToastViewport />
    </QueryClientProvider>
  );
}
