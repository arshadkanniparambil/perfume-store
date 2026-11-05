export type Locale = "en" | "ar";

export type Product = {
  slug: string;
  brand: string;
  brandAr: string;
  name: string;
  nameAr: string;
  price: number;
  tone: string;
  sizes: { ml: number; price: number }[];
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

export const brands = [
  "All brands",
  "Afnan",
  "Lattafa",
  "Ahmed Al Maghribi",
  "Armaf",
  "Al Haramain",
];

export const products: Product[] = [
  {
    slug: "afnan-9pm",
    brand: "Afnan",
    brandAr: "أفنان",
    name: "9PM",
    nameAr: "9PM",
    price: 139,
    tone: "#3E5C76",
    sizes: [{ ml: 30, price: 49 }, { ml: 50, price: 89 }, {
      ml: 100,
      price: 139,
    }],
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
    brand: "Afnan",
    brandAr: "أفنان",
    name: "Turathi Blue",
    nameAr: "توراثي بلو",
    price: 159,
    tone: "#2D4F6E",
    sizes: [{ ml: 100, price: 159 }],
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
    brand: "Lattafa",
    brandAr: "لطافة",
    name: "Khamrah",
    nameAr: "خمرة",
    price: 129,
    tone: "#7A3B3B",
    sizes: [{ ml: 100, price: 129 }],
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
    brand: "Lattafa",
    brandAr: "لطافة",
    name: "Asad",
    nameAr: "أسد",
    price: 119,
    tone: "#5E3A2A",
    sizes: [{ ml: 100, price: 119 }],
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
    brand: "Ahmed Al Maghribi",
    brandAr: "أحمد المغربي",
    name: "Marj",
    nameAr: "مرج",
    price: 99,
    tone: "#7A5C2E",
    sizes: [{ ml: 100, price: 99 }],
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
    brand: "Ahmed Al Maghribi",
    brandAr: "أحمد المغربي",
    name: "Ignite",
    nameAr: "إغنايت",
    price: 149,
    tone: "#6B4F25",
    sizes: [{ ml: 100, price: 149 }],
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
    brand: "Armaf",
    brandAr: "أرماف",
    name: "Club de Nuit Intense Man",
    nameAr: "كلوب دي نوي إنتنس مان",
    price: 169,
    tone: "#2E4F4A",
    sizes: [{ ml: 100, price: 169 }],
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
    brand: "Al Haramain",
    brandAr: "الحرمين",
    name: "Amber Oud",
    nameAr: "أمبر عود",
    price: 189,
    tone: "#5B4A6B",
    sizes: [{ ml: 100, price: 189 }],
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

export function money(value: number, locale: Locale) {
  return locale === "ar" ? `${value} ر.س` : `SAR ${value}`;
}
