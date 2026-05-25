import type { Metadata } from "next";
import { QueryProvider } from "./_providers/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "USEN PAY Operations",
  description: "Merchant operations console for orders, payments, checkout, and visitor flow.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
