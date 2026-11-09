/**
 * The original sample catalog.
 *
 * - `npm run db:seed` loads it into Supabase.
 * - The storefront falls back to it when Supabase is not configured, so the
 *   site still runs locally without a database.
 *
 * Prices are integer halalas (SAR 49 = 4900). Stock numbers are samples.
 */
import type { Product, ProductSize } from "./catalog.ts";

export type SampleBrand = { slug: string; name: string; nameAr: string };
export type SampleCategory = { slug: string; name: string; nameAr: string };

export const sampleBrands: SampleBrand[] = [
  { slug: "afnan", name: "Afnan", nameAr: "أفنان" },
  { slug: "lattafa", name: "Lattafa", nameAr: "لطافة" },
  { slug: "ahmed-al-maghribi", name: "Ahmed Al Maghribi", nameAr: "أحمد المغربي" },
  { slug: "armaf", name: "Armaf", nameAr: "أرماف" },
  { slug: "al-haramain", name: "Al Haramain", nameAr: "الحرمين" },
];

export const sampleCategories: SampleCategory[] = [
  { slug: "new-arrivals", name: "New arrivals", nameAr: "وصل حديثاً" },
  { slug: "men", name: "Men", nameAr: "رجالي" },
  { slug: "women", name: "Women", nameAr: "نسائي" },
  { slug: "unisex", name: "Unisex", nameAr: "للجنسين" },
  { slug: "oud-attar", name: "Oud & attar", nameAr: "عود ودهن عود" },
  { slug: "gift-sets", name: "Gift sets", nameAr: "هدايا" },
];

type RawProduct =
  & Omit<Product, "sizes" | "brandSlug" | "images" | "concentration">
  & { sizes: Omit<ProductSize, "sku">[] };

/** SKU codes look like AFNAN-9PM-50ML. */
export function sampleSku(slug: string, ml: number) {
  return `${slug.toUpperCase()}-${ml}ML`;
}

const rawProducts: RawProduct[] = [
  {
    slug: "afnan-9pm",
    categories: ["new-arrivals", "men"],
    brand: "Afnan",
    brandAr: "أفنان",
    name: "9PM",
    nameAr: "9PM",
    tone: "#3E5C76",
    sizes: [
      { ml: 30, priceHalalas: 4900, stock: 3 },
      { ml: 50, priceHalalas: 8900, stock: 8 },
      { ml: 100, priceHalalas: 13900, stock: 12 },
    ],
    description:
      "A warm and confident scent for evenings and special occasions.",
    descriptionAr: "عطر دافئ وواثق للأمسيات والمناسبات الخاصة.",
    notes: {
      top: "Apple, cinnamon",
      heart: "Lavender, orange blossom",
      base: "Vanilla, tonka bean",
      topAr: "تفاح، قرفة",
      heartAr: "لافندر، زهر البرتقال",
      baseAr: "فانيلا، تونكا",
    },
  },
  {
    slug: "afnan-turathi-blue",
    categories: ["men"],
    brand: "Afnan",
    brandAr: "أفنان",
    name: "Turathi Blue",
    nameAr: "توراثي بلو",
    tone: "#2D4F6E",
    sizes: [{ ml: 100, priceHalalas: 15900, stock: 6 }],
    description: "A fresh, elegant fragrance with a refined presence.",
    descriptionAr: "عطر منعش وأنيق بحضور راقٍ.",
    notes: {
      top: "Citrus",
      heart: "Amber",
      base: "Musk",
      topAr: "حمضيات",
      heartAr: "عنبر",
      baseAr: "مسك",
    },
  },
  {
    slug: "lattafa-khamrah",
    categories: ["new-arrivals", "unisex"],
    brand: "Lattafa",
    brandAr: "لطافة",
    name: "Khamrah",
    nameAr: "خمرة",
    tone: "#7A3B3B",
    sizes: [{ ml: 100, priceHalalas: 12900, stock: 2 }],
    description: "A rich, sweet scent with an inviting oriental character.",
    descriptionAr: "عطر غني وحلو بطابع شرقي جذاب.",
    notes: {
      top: "Cinnamon, nutmeg",
      heart: "Dates, praline",
      base: "Vanilla, amberwood",
      topAr: "قرفة، جوزة الطيب",
      heartAr: "تمر، برالين",
      baseAr: "فانيلا، خشب العنبر",
    },
  },
  {
    slug: "lattafa-asad",
    categories: ["men"],
    brand: "Lattafa",
    brandAr: "لطافة",
    name: "Asad",
    nameAr: "أسد",
    tone: "#5E3A2A",
    sizes: [{ ml: 100, priceHalalas: 11900, stock: 10 }],
    description: "A bold spicy fragrance for a memorable signature.",
    descriptionAr: "عطر جريء وتوابلي لتوقيع لا يُنسى.",
    notes: {
      top: "Black pepper",
      heart: "Coffee",
      base: "Amber",
      topAr: "فلفل أسود",
      heartAr: "قهوة",
      baseAr: "عنبر",
    },
  },
  {
    slug: "ahmed-al-maghribi-marj",
    categories: ["unisex", "oud-attar"],
    brand: "Ahmed Al Maghribi",
    brandAr: "أحمد المغربي",
    name: "Marj",
    nameAr: "مرج",
    tone: "#7A5C2E",
    sizes: [{ ml: 100, priceHalalas: 9900, stock: 15 }],
    description: "An inviting Arabian fragrance for everyday wear.",
    descriptionAr: "عطر عربي جذاب للاستخدام اليومي.",
    notes: {
      top: "Bergamot",
      heart: "Rose",
      base: "Oud",
      topAr: "برغموت",
      heartAr: "ورد",
      baseAr: "عود",
    },
  },
  {
    slug: "ahmed-al-maghribi-ignite",
    categories: ["men"],
    brand: "Ahmed Al Maghribi",
    brandAr: "أحمد المغربي",
    name: "Ignite",
    nameAr: "إغنايت",
    tone: "#6B4F25",
    sizes: [{ ml: 100, priceHalalas: 14900, stock: 0 }],
    description: "A sophisticated woody composition.",
    descriptionAr: "تركيبة خشبية راقية.",
    notes: {
      top: "Saffron",
      heart: "Jasmine",
      base: "Cedarwood",
      topAr: "زعفران",
      heartAr: "ياسمين",
      baseAr: "خشب الأرز",
    },
  },
  {
    slug: "armaf-club-de-nuit",
    categories: ["men"],
    brand: "Armaf",
    brandAr: "أرماف",
    name: "Club de Nuit Intense Man",
    nameAr: "كلوب دي نوي إنتنس مان",
    tone: "#2E4F4A",
    sizes: [{ ml: 100, priceHalalas: 16900, stock: 9 }],
    description: "A confident, contemporary fragrance for any occasion.",
    descriptionAr: "عطر عصري وواثق لكل مناسبة.",
    notes: {
      top: "Lemon, pineapple",
      heart: "Birch, jasmine",
      base: "Musk, ambergris",
      topAr: "ليمون، أناناس",
      heartAr: "بتولا، ياسمين",
      baseAr: "مسك، عنبر",
    },
  },
  {
    slug: "al-haramain-amber-oud",
    categories: ["unisex", "oud-attar"],
    brand: "Al Haramain",
    brandAr: "الحرمين",
    name: "Amber Oud",
    nameAr: "أمبر عود",
    tone: "#5B4A6B",
    sizes: [{ ml: 100, priceHalalas: 18900, stock: 4 }],
    description: "A smooth amber and oud composition with lasting depth.",
    descriptionAr: "تركيبة ناعمة من العنبر والعود بعمق يدوم.",
    notes: {
      top: "Bergamot",
      heart: "Amber",
      base: "Oud",
      topAr: "برغموت",
      heartAr: "عنبر",
      baseAr: "عود",
    },
  },
];

export const sampleProducts: Product[] = rawProducts.map((product) => {
  const brand = sampleBrands.find((item) => item.name === product.brand);
  if (!brand) throw new Error(`Unknown brand for ${product.slug}`);
  return {
    ...product,
    brandSlug: brand.slug,
    concentration: "Eau de Parfum",
    images: [],
    sizes: product.sizes.map((size) => ({
      ...size,
      sku: sampleSku(product.slug, size.ml),
    })),
  };
});
