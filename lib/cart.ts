/**
 * Pure shopping-cart logic. No React and no browser APIs, so it can be unit
 * tested directly and reused by any storage layer.
 *
 * A cart line identifies a product *variant* (product slug + size in ml).
 * Prices, names and images are never stored in the cart; they are always read
 * from the catalog so the cart shows current, correct values.
 */
import {
  type Product,
  products as defaultCatalog,
  type ProductSize,
} from "./catalog.ts";

export type CartLine = { slug: string; ml: number; quantity: number };
export type Cart = readonly CartLine[];

export type ResolvedCartLine = CartLine & {
  id: string;
  product: Product;
  size: ProductSize;
  unitPrice: number;
  lineTotal: number;
};

export const CART_STORAGE_KEY = "perfume-store:cart:v1";

export const emptyCart: Cart = Object.freeze([]);

export function lineId(slug: string, ml: number) {
  return `${slug}::${ml}`;
}

export function findVariant(
  slug: string,
  ml: number,
  catalog: readonly Product[] = defaultCatalog,
): { product: Product; size: ProductSize } | null {
  const product = catalog.find((item) => item.slug === slug);
  const size = product?.sizes.find((option) => option.ml === ml);
  return product && size ? { product, size } : null;
}

/** Quantity of one variant already in the cart. */
export function quantityInCart(cart: Cart, slug: string, ml: number) {
  return cart.find((line) => line.slug === slug && line.ml === ml)?.quantity ??
    0;
}

/** How many more units of a variant can still be added. */
export function remainingStock(
  cart: Cart,
  slug: string,
  ml: number,
  catalog: readonly Product[] = defaultCatalog,
) {
  const variant = findVariant(slug, ml, catalog);
  if (!variant) return 0;
  return Math.max(0, variant.size.stock - quantityInCart(cart, slug, ml));
}

export type AddResult = {
  cart: Cart;
  /** Units actually added; lower than requested when stock ran out. */
  added: number;
};

/**
 * Adds `quantity` units of a variant. Adding a variant that is already in the
 * cart increases that line; a different size of the same product becomes its
 * own line. The total for a variant never exceeds its stock.
 */
export function addItem(
  cart: Cart,
  slug: string,
  ml: number,
  quantity = 1,
  catalog: readonly Product[] = defaultCatalog,
): AddResult {
  const requested = Math.floor(quantity);
  if (!Number.isFinite(requested) || requested < 1) return { cart, added: 0 };
  const added = Math.min(
    requested,
    remainingStock(cart, slug, ml, catalog),
  );
  if (added === 0) return { cart, added: 0 };
  const existing = quantityInCart(cart, slug, ml);
  const next = existing > 0
    ? cart.map((line) =>
      line.slug === slug && line.ml === ml
        ? { ...line, quantity: line.quantity + added }
        : line
    )
    : [...cart, { slug, ml, quantity: added }];
  return { cart: next, added };
}

/**
 * Sets the quantity of a line, clamped to the variant's stock. A quantity of
 * zero or less removes the line.
 */
export function updateQuantity(
  cart: Cart,
  slug: string,
  ml: number,
  quantity: number,
  catalog: readonly Product[] = defaultCatalog,
): Cart {
  if (quantityInCart(cart, slug, ml) === 0) return cart;
  const variant = findVariant(slug, ml, catalog);
  const wanted = Math.floor(quantity);
  if (!variant || !Number.isFinite(wanted) || wanted <= 0) {
    return removeItem(cart, slug, ml);
  }
  const clamped = Math.min(wanted, variant.size.stock);
  if (clamped <= 0) return removeItem(cart, slug, ml);
  return cart.map((line) =>
    line.slug === slug && line.ml === ml ? { ...line, quantity: clamped } : line
  );
}

export function removeItem(cart: Cart, slug: string, ml: number): Cart {
  return cart.filter((line) => !(line.slug === slug && line.ml === ml));
}

/** Attaches catalog data (product, size, price, totals) to each line. */
export function resolveCart(
  cart: Cart,
  catalog: readonly Product[] = defaultCatalog,
): ResolvedCartLine[] {
  return cart.flatMap((line) => {
    const variant = findVariant(line.slug, line.ml, catalog);
    if (!variant) return [];
    return [{
      ...line,
      id: lineId(line.slug, line.ml),
      product: variant.product,
      size: variant.size,
      unitPrice: variant.size.price,
      lineTotal: variant.size.price * line.quantity,
    }];
  });
}

/** Total number of units in the cart (shown on the header badge). */
export function cartCount(cart: Cart) {
  return cart.reduce((total, line) => total + line.quantity, 0);
}

export function cartSubtotal(
  cart: Cart,
  catalog: readonly Product[] = defaultCatalog,
) {
  return resolveCart(cart, catalog).reduce(
    (total, line) => total + line.lineTotal,
    0,
  );
}

/**
 * Turns untrusted data (e.g. from localStorage) into a valid cart: drops
 * malformed lines and unknown variants, merges duplicate variants, and clamps
 * quantities to current stock.
 */
export function sanitizeCart(
  raw: unknown,
  catalog: readonly Product[] = defaultCatalog,
): Cart {
  if (!Array.isArray(raw)) return emptyCart;
  let cart: Cart = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const { slug, ml, quantity } = entry as Record<string, unknown>;
    if (
      typeof slug !== "string" || typeof ml !== "number" ||
      typeof quantity !== "number"
    ) continue;
    cart = addItem(cart, slug, ml, quantity, catalog).cart;
  }
  return cart;
}

export function serializeCart(cart: Cart) {
  return JSON.stringify(
    cart.map(({ slug, ml, quantity }) => ({ slug, ml, quantity })),
  );
}

export function deserializeCart(
  value: string | null,
  catalog: readonly Product[] = defaultCatalog,
): Cart {
  if (!value) return emptyCart;
  try {
    return sanitizeCart(JSON.parse(value), catalog);
  } catch {
    return emptyCart;
  }
}
