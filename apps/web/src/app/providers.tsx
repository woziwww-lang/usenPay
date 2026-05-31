import type { ReactNode } from "react";
import { QueryProvider } from "./_providers/query-provider";
import { ErrorBoundary } from "./error-boundary";

type Props = {
  children: ReactNode;
};

export function AppProviders({ children }: Props) {
  return (
    <ErrorBoundary>
      <QueryProvider>{children}</QueryProvider>
    </ErrorBoundary>
  );
}
