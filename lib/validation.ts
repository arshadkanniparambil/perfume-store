/**
 * Server-side validation with zod.
 *
 * - `parseCatalog` checks the JSON returned by the database's get_catalog()
 *   before the app trusts it.
 * - `cartValidationRequest` + `validateCart` check a cart sent by the browser
 *   against live prices and stock. The browser's own numbers are never
 *   trusted for anything that costs money.
 */
import { z } from "zod";
import type { Product } from "./catalog.ts";

const slug = z.string().min(1).max(120).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
const halalas = z.number().int().nonnegative().max(100_000_000);

const catalogProduct = z.object({
  slug,
  nameEn: z.string().min(1),
  nameAr: z.string().min(1),
  descriptionEn: z.string(),
  descriptionAr: z.string(),
  concentration: z.string(),
  notes: z.object({
    topEn: z.string(),
    heartEn: z.string(),
    baseEn: z.string(),
    topAr: z.string(),
    heartAr: z.string(),
    baseAr: z.string(),
  }),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  brand: z.object({ slug, nameEn: z.string(), nameAr: z.string() }),
  categories: z.array(slug),
  variants: z.array(z.object({
    sku: z.string().min(1),
    sizeMl: z.number().int().positive(),
    priceHalalas: halalas,
    stock: z.number().int().nonnegative(),
  })),
  images: z.array(z.object({
    url: z.string().min(1),
    altEn: z.string(),
    altAr: z.string(),
  })),
});

/** Converts get_catalog() JSON into storefront products. Throws if malformed. */
export function parseCatalog(json: unknown): Product[] {
  return z.array(catalogProduct).parse(json)
    // A product with no sellable size can't be shown or bought.
    .filter((row) => row.variants.length > 0)
    .map((row) => ({
      slug: row.slug,
      brandSlug: row.brand.slug,
      brand: row.brand.nameEn,
      brandAr: row.brand.nameAr,
      name: row.nameEn,
      nameAr: row.nameAr,
      concentration: row.concentration,
      tone: row.accentColor,
      categories: row.categories,
      sizes: [...row.variants]
        .sort((a, b) => a.sizeMl - b.sizeMl)
        .map((variant) => ({
          sku: variant.sku,
          ml: variant.sizeMl,
          priceHalalas: variant.priceHalalas,
          stock: variant.stock,
        })),
      images: row.images.map((image) => ({
        url: image.url,
        alt: image.altEn,
        altAr: image.altAr,
      })),
      description: row.descriptionEn,
      descriptionAr: row.descriptionAr,
      notes: {
        top: row.notes.topEn,
        heart: row.notes.heartEn,
        base: row.notes.baseEn,
        topAr: row.notes.topAr,
        heartAr: row.notes.heartAr,
        baseAr: row.notes.baseAr,
      },
    }));
}

export const MAX_CART_LINES = 50;
export const MAX_LINE_QUANTITY = 99;

export const cartValidationRequest = z.object({
  items: z.array(
    z.object({
      slug,
      ml: z.number().int().positive().max(5000),
      quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY),
    }).strict(),
  ).max(MAX_CART_LINES),
}).strict();

export type CartValidationRequest = z.infer<typeof cartValidationRequest>;

export type ValidatedLine = {
  slug: string;
  ml: number;
  sku: string | null;
  requestedQuantity: number;
  /** Quantity that can actually be bought (0 when unavailable). */
  quantity: number;
  unitPriceHalalas: number;
  lineTotalHalalas: number;
  status: "ok" | "reduced" | "out_of_stock" | "not_found";
};

export type CartValidationResult = {
  items: ValidatedLine[];
  itemCount: number;
  subtotalHalalas: number;
  valid: boolean;
};

/** Checks requested lines against the catalog's current prices and stock. */
export function validateCart(
  items: CartValidationRequest["items"],
  catalog: readonly Product[],
): CartValidationResult {
  // Merge duplicate lines for the same variant before checking stock.
  const merged = new Map<string, { slug: string; ml: number; quantity: number }>();
  for (const item of items) {
    const key = `${item.slug}::${item.ml}`;
    const existing = merged.get(key);
    if (existing) existing.quantity += item.quantity;
    else merged.set(key, { ...item });
  }

  const lines = [...merged.values()].map((item): ValidatedLine => {
    const product = catalog.find((entry) => entry.slug === item.slug);
    const size = product?.sizes.find((entry) => entry.ml === item.ml);
    if (!size) {
      return {
        ...item,
        sku: null,
        requestedQuantity: item.quantity,
        quantity: 0,
        unitPriceHalalas: 0,
        lineTotalHalalas: 0,
        status: "not_found",
      };
    }
    const quantity = Math.min(item.quantity, size.stock);
    return {
      slug: item.slug,
      ml: item.ml,
      sku: size.sku,
      requestedQuantity: item.quantity,
      quantity,
      unitPriceHalalas: size.priceHalalas,
      lineTotalHalalas: size.priceHalalas * quantity,
      status: quantity === item.quantity
        ? "ok"
        : quantity === 0
        ? "out_of_stock"
        : "reduced",
    };
  });

  return {
    items: lines,
    itemCount: lines.reduce((total, line) => total + line.quantity, 0),
    subtotalHalalas: lines.reduce((total, line) => total + line.lineTotalHalalas, 0),
    valid: lines.every((line) => line.status === "ok"),
  };
}
