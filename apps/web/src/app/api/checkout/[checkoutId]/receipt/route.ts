import { backendFetch } from "@/shared/api/mock-backend";

type Context = {
  params: Promise<{ checkoutId: string }>;
};

export async function POST(_request: Request, context: Context) {
  const { checkoutId } = await context.params;
  return backendFetch(`/checkout/${checkoutId}/receipt`, { method: "POST" });
}
