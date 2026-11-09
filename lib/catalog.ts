export type Locale = "en" | "ar";

/** One sellable size of a product (a SKU). */
export type ProductSize = {
  sku: string;
  ml: number;
  /** Price in halalas (1 SAR = 100 halalas). Always an integer. */
  priceHalalas: number;
  /** Units available to sell. 0 means out of stock. */
  stock: number;
};

export type ProductImage = { url: string; alt: string; altAr: string };

export type Product = {
  slug: string;
  brandSlug: string;
  brand: string;
  brandAr: string;
  name: string;
  nameAr: string;
  concentration: string;
  /** Colour of the placeholder bottle shown when there is no photo. */
  tone: string;
  categories: string[];
  /** Each size is a separate purchasable variant with its own price and stock. */
  sizes: ProductSize[];
  images: ProductImage[];
  description: string;
  descriptionAr: string;
  notes: {
    top: string;
    heart: string;
    base: string;
    topAr: string;
    heartAr: string;
    baseAr: string;
  };
};

export function findProduct(
  catalog: readonly Product[],
  slug: string,
): Product | undefined {
  return catalog.find((product) => product.slug === slug);
}

/** The size shown on product cards and pre-selected on the product page. */
export function defaultSize(product: Product): ProductSize {
  return product.sizes[product.sizes.length - 1];
}

/** Formats integer halalas as a price, e.g. 4900 → "SAR 49", 4950 → "SAR 49.50". */
export function money(halalas: number, locale: Locale) {
  const sar = halalas % 100 === 0
    ? String(halalas / 100)
    : (halalas / 100).toFixed(2);
  return locale === "ar" ? `${sar} ر.س` : `SAR ${sar}`;
}
