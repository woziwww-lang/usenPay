import { backendFetch } from "@/shared/api/mock-backend";

type Context = {
  params: Promise<{ checkoutId: string }>;
};

export async function POST(request: Request, context: Context) {
  const { checkoutId } = await context.params;
  return backendFetch(`/checkout/${checkoutId}/split`, {
    method: "POST",
    body: await request.json().catch(() => ({})),
  });
}
