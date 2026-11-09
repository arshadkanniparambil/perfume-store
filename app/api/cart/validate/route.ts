import { getCatalog } from "@/lib/server/catalog";
import { cartValidationRequest, validateCart } from "@/lib/validation";

// Always check against live stock and prices, never a cached copy.
export const dynamic = "force-dynamic";

/**
 * POST /api/cart/validate
 * Body: { "items": [{ "slug": "afnan-9pm", "ml": 50, "quantity": 2 }] }
 *
 * Returns each line with the quantity that can actually be bought, its
 * current price in halalas, and the subtotal.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const parsed = cartValidationRequest.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: "Invalid cart.",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }
  const catalog = await getCatalog();
  return Response.json(validateCart(parsed.data.items, catalog));
}
