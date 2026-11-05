"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  brands,
  type Locale,
  money,
  type Product,
  products,
} from "@/lib/catalog";

type Dictionary = Record<string, string>;
const copy: Record<Locale, Dictionary> = {
  en: {
    announce: "Delivery across Saudi Arabia · Pay online or cash on delivery",
    shopName: "[YOUR SHOP NAME]",
    search: "Search perfumes, brands or notes",
    cart: "Cart",
    new: "New arrivals",
    men: "Men",
    women: "Women",
    unisex: "Unisex",
    oud: "Oud & attar",
    gifts: "Gift sets",
    eyebrow: "MULTI-BRAND PERFUME HOUSE",
    hero: "Find your signature scent",
    heroP:
      "Arabian and designer fragrances from the brands you ask for, together in one shop.",
    all: "Shop all perfumes",
    byBrand: "Shop by brand",
    shopTitle: "Shop by brand",
    shopSub: "Choose a brand to filter the collection.",
    add: "Add to cart",
    delivery: "Delivery across the Kingdom",
    deliveryP: "We pack your order at our shop and deliver it to your door.",
    payment: "Pay online or on delivery",
    paymentP: "Mada, Apple Pay, STC Pay (depends on the gateway you enable).",
    pickup: "Pickup from the shop",
    pickupP: "Collect your order from our shop in [CITY].",
    about:
      "Original perfumes from leading Arabian and international houses, delivered across the Kingdom.",
    help: "Help",
    footerShop: "Shop",
    shipping: "Shipping and delivery",
    returns: "Returns and exchanges",
    whatsapp: "WhatsApp: [NUMBER]",
    legal:
      "Mockup with sample prices and placeholder details. CR: [CR NUMBER] · VAT: [VAT NUMBER]",
    size: "Size",
    vat: "Prices include VAT",
    description: "Description",
    notes: "Fragrance notes",
    top: "Top",
    heart: "Heart",
    base: "Base",
    like: "You may also like",
    order: "Order on WhatsApp",
    detailDelivery: "Delivery: across Saudi Arabia, packed at our shop.",
    detailPayment: "Payment: online, or cash on delivery on eligible orders.",
    detailPickup: "Pickup: from our shop in [CITY].",
    home: "Home",
    product: "Eau de Parfum",
  },
  ar: {
    announce: "توصيل لجميع مناطق المملكة · الدفع أونلاين أو عند الاستلام",
    shopName: "[اسم المتجر]",
    search: "ابحث عن عطر أو ماركة أو نوتة",
    cart: "السلة",
    new: "وصل حديثاً",
    men: "رجالي",
    women: "نسائي",
    unisex: "للجنسين",
    oud: "عود ودهن عود",
    gifts: "هدايا",
    eyebrow: "بيت عطور متعدد الماركات",
    hero: "اكتشف عطرك المميز",
    heroP: "عطور عربية وعالمية من الماركات التي تفضلها، مجتمعة في متجر واحد.",
    all: "تسوق كل العطور",
    byBrand: "تسوق حسب الماركة",
    shopTitle: "تسوق حسب الماركة",
    shopSub: "اختر ماركة لعرض عطورها.",
    add: "أضف إلى السلة",
    delivery: "توصيل لجميع أنحاء المملكة",
    deliveryP: "نجهز طلبك من متجرنا ونوصله إلى باب بيتك.",
    payment: "الدفع أونلاين أو عند الاستلام",
    paymentP: "مدى، أبل باي، STC Pay (حسب بوابة الدفع المفعلة).",
    pickup: "الاستلام من المتجر",
    pickupP: "استلم طلبك من متجرنا في [المدينة].",
    about:
      "عطور أصلية من أشهر البيوت العربية والعالمية، نوصلها إلى جميع أنحاء المملكة.",
    help: "المساعدة",
    footerShop: "التسوق",
    shipping: "الشحن والتوصيل",
    returns: "الاستبدال والاسترجاع",
    whatsapp: "واتساب: [الرقم]",
    legal:
      "نموذج تجريبي بأسعار وبيانات تجريبية. السجل التجاري: [رقم السجل] · الضريبة: [الرقم الضريبي]",
    size: "الحجم",
    vat: "الأسعار تشمل ضريبة القيمة المضافة",
    description: "الوصف",
    notes: "نوتات العطر",
    top: "المقدمة",
    heart: "القلب",
    base: "القاعدة",
    like: "قد يعجبك أيضاً",
    order: "اطلب عبر واتساب",
    detailDelivery: "التوصيل: لجميع أنحاء المملكة، نجهز طلبك من متجرنا.",
    detailPayment: "الدفع: أونلاين أو عند الاستلام للطلبات المؤهلة.",
    detailPickup: "الاستلام: من متجرنا في [المدينة].",
    home: "الرئيسية",
    product: "أو دو بارفان",
  },
};

function Bottle({ tone, small = false }: { tone: string; small?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={small ? "bottle bottle-small" : "bottle"}
      viewBox="0 0 120 200"
    >
      <rect x="44" y="8" width="32" height="26" rx="3" fill="#B38B3D" />
      <rect x="52" y="34" width="16" height="12" fill="#8C9893" />
      <rect x="14" y="46" width="92" height="142" rx="10" fill={tone} />
      <rect
        x="26"
        y="68"
        width="68"
        height="60"
        rx="3"
        fill="#fff"
        opacity=".22"
      />
    </svg>
  );
}

export function AnnouncementBar({ text }: { text: string }) {
  return <div className="announce">{text}</div>;
}

export function Header(
  { locale, onLocaleChange, cart }: {
    locale: Locale;
    onLocaleChange: () => void;
    cart: number;
  },
) {
  const t = copy[locale];
  return (
    <>
      <AnnouncementBar text={t.announce} />
      <header className="site-header">
        <div className="wrap header-row">
          <Link className="logo" href="/">{t.shopName}</Link>
          <div className="search">
            <input type="search" placeholder={t.search} aria-label={t.search} />
          </div>
          <div className="header-actions">
            <button className="btn-lang" type="button" onClick={onLocaleChange}>
              {locale === "en" ? "العربية" : "English"}
            </button>
            <button className="btn-cart" type="button" aria-label={t.cart}>
              <CartIcon />
              <span>{t.cart}</span>
              <span className="cart-count">{cart}</span>
            </button>
          </div>
        </div>
        <Navigation locale={locale} />
      </header>
    </>
  );
}

export function Navigation({ locale }: { locale: Locale }) {
  const t = copy[locale];
  return (
    <nav className="main-nav" aria-label="Categories">
      <div className="wrap">
        {[t.new, t.men, t.women, t.unisex, t.oud, t.gifts].map((item) => (
          <a href="#shop" key={item}>{item}</a>
        ))}
      </div>
    </nav>
  );
}

export function Hero({ locale }: { locale: Locale }) {
  const t = copy[locale];
  return (
    <section className="hero">
      <div className="wrap hero-row">
        <div className="hero-text">
          <div className="eyebrow">{t.eyebrow}</div>
          <h1>{t.hero}</h1>
          <p>{t.heroP}</p>
          <div className="hero-cta">
            <a className="btn-gold" href="#shop">{t.all}</a>
            <a className="btn-outline-light" href="#shop">{t.byBrand}</a>
          </div>
        </div>
        <div className="hero-art">
          <Bottle tone="#3E5C76" />
          <Bottle tone="#7A3B3B" />
          <Bottle tone="#7A5C2E" />
        </div>
      </div>
      <BrandStrip locale={locale} />
    </section>
  );
}
export function BrandStrip({ locale }: { locale: Locale }) {
  const names = locale === "ar"
    ? ["أفنان", "لطافة", "أحمد المغربي", "أرماف", "الحرمين"]
    : ["AFNAN", "LATTAFA", "AHMED AL MAGHRIBI", "ARMAF", "AL HARAMAIN"];
  return (
    <div className="brand-strip">
      <div className="wrap">
        {names.map((name) => <span key={name}>{name}</span>)}
      </div>
    </div>
  );
}

export function ProductCard(
  { product, locale, onAdd }: {
    product: Product;
    locale: Locale;
    onAdd?: () => void;
  },
) {
  const t = copy[locale];
  const name = locale === "ar" ? product.nameAr : product.name;
  const brand = locale === "ar" ? product.brandAr : product.brand;
  return (
    <article className="card">
      <Link
        className="card-img"
        href={`/products/${product.slug}`}
        aria-label={name}
      >
        <Bottle tone={product.tone} small />
      </Link>
      <div className="card-body">
        <div className="card-brand">{brand}</div>
        <Link className="card-name" href={`/products/${product.slug}`}>
          {name}
        </Link>
        <div className="card-spec">{t.product} · 100 ml</div>
        <div className="card-price">{money(product.price, locale)}</div>
        {onAdd && (
          <button className="btn-add" type="button" onClick={onAdd}>
            {t.add}
          </button>
        )}
      </div>
    </article>
  );
}
export function ProductGrid(
  { items, locale, onAdd }: {
    items: Product[];
    locale: Locale;
    onAdd: () => void;
  },
) {
  return (
    <div className="grid">
      {items.map((product) => (
        <ProductCard
          key={product.slug}
          product={product}
          locale={locale}
          onAdd={onAdd}
        />
      ))}
    </div>
  );
}

export function Footer({ locale }: { locale: Locale }) {
  const t = copy[locale];
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div>
          <div className="footer-logo">{t.shopName}</div>
          <p>{t.about}</p>
        </div>
        <div className="footer-col">
          <h4>{t.footerShop}</h4>
          <div>
            <span>{t.new}</span>
            <span>{t.men}</span>
            <span>{t.women}</span>
            <span>{t.gifts}</span>
          </div>
        </div>
        <div className="footer-col">
          <h4>{t.help}</h4>
          <div>
            <span>{t.shipping}</span>
            <span>{t.returns}</span>
            <span>{t.whatsapp}</span>
          </div>
        </div>
      </div>
      <div className="footer-legal">
        <div className="wrap">{t.legal}</div>
      </div>
    </footer>
  );
}

function Trust({ locale }: { locale: Locale }) {
  const t = copy[locale];
  return (
    <section className="trust">
      <div className="wrap">
        <div className="trust-box">
          <h3>{t.delivery}</h3>
          <p>{t.deliveryP}</p>
        </div>
        <div className="trust-box">
          <h3>{t.payment}</h3>
          <p>{t.paymentP}</p>
        </div>
        <div className="trust-box">
          <h3>{t.pickup}</h3>
          <p>{t.pickupP}</p>
        </div>
      </div>
    </section>
  );
}

export function HomeStorefront() {
  const [locale, setLocale] = useState<Locale>("en");
  const [activeBrand, setActiveBrand] = useState("All brands");
  const [cart, setCart] = useState(0);
  const t = copy[locale];
  const visibleProducts = useMemo(
    () =>
      activeBrand === "All brands"
        ? products
        : products.filter((item) => item.brand === activeBrand),
    [activeBrand],
  );
  const localizedBrand = (brand: string) =>
    locale === "ar"
      ? ({
        "All brands": "كل الماركات",
        Afnan: "أفنان",
        Lattafa: "لطافة",
        "Ahmed Al Maghribi": "أحمد المغربي",
        Armaf: "أرماف",
        "Al Haramain": "الحرمين",
      }[brand] ?? brand)
      : brand;
  return (
    <main lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <Header
        locale={locale}
        onLocaleChange={() => setLocale(locale === "en" ? "ar" : "en")}
        cart={cart}
      />
      <Hero locale={locale} />
      <section className="shop" id="shop">
        <div className="wrap">
          <h2>{t.shopTitle}</h2>
          <p className="sub">{t.shopSub}</p>
          <div className="chips" role="group" aria-label={t.byBrand}>
            {brands.map((brand) => (
              <button
                className="chip"
                type="button"
                key={brand}
                aria-pressed={activeBrand === brand}
                onClick={() => setActiveBrand(brand)}
              >
                {localizedBrand(brand)}
              </button>
            ))}
          </div>
          <ProductGrid
            items={visibleProducts}
            locale={locale}
            onAdd={() => setCart((count) => count + 1)}
          />
        </div>
      </section>
      <Trust locale={locale} />
      <Footer locale={locale} />
    </main>
  );
}

export function ProductGallery({ product }: { product: Product }) {
  return (
    <div className="gallery">
      <div className="gallery-main">
        <Bottle tone={product.tone} />
      </div>
      <div className="thumbs" aria-label="Product images">
        <button className="active" aria-label="Main product image">
          <Bottle tone={product.tone} small />
        </button>
        <button aria-label="Product thumbnail" />
        <button aria-label="Product thumbnail" />
        <button aria-label="Product thumbnail" />
      </div>
    </div>
  );
}

export function ProductDetails(
  { product, locale, onAdd }: {
    product: Product;
    locale: Locale;
    onAdd: (quantity: number) => void;
  },
) {
  const t = copy[locale];
  const [size, setSize] = useState(product.sizes[product.sizes.length - 1]);
  const [quantity, setQuantity] = useState(1);
  const name = locale === "ar" ? product.nameAr : product.name;
  const brand = locale === "ar" ? product.brandAr : product.brand;
  return (
    <div className="details">
      <div className="p-brand">{brand}</div>
      <h1 className="p-title">{name}</h1>
      <div className="p-sub">{t.product}</div>
      <div className="p-price">{money(size.price * quantity, locale)}</div>
      <div className="p-vat">{t.vat}</div>
      <div className="label">{t.size}</div>
      <div className="sizes" role="group" aria-label={t.size}>
        {product.sizes.map((option) => (
          <button
            className="size"
            type="button"
            key={option.ml}
            aria-pressed={size.ml === option.ml}
            onClick={() => setSize(option)}
          >
            {option.ml} ml
          </button>
        ))}
      </div>
      <div className="buy-row">
        <div className="qty">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span aria-live="polite">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity(quantity + 1)}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <button
          className="btn-primary"
          type="button"
          onClick={() => onAdd(quantity)}
        >
          {t.add}
        </button>
      </div>
      <a
        className="btn-outline"
        href="https://wa.me/"
        target="_blank"
        rel="noreferrer"
      >
        {t.order}
      </a>
      <div className="p-info">
        <div>{t.detailDelivery}</div>
        <div>{t.detailPayment}</div>
        <div>{t.detailPickup}</div>
      </div>
    </div>
  );
}

export function ProductStorefront({ product }: { product: Product }) {
  const [locale, setLocale] = useState<Locale>("en");
  const [cart, setCart] = useState(0);
  const t = copy[locale];
  const related = products.filter((item) => item.slug !== product.slug).slice(
    0,
    4,
  );
  const description = locale === "ar"
    ? product.descriptionAr
    : product.description;
  return (
    <main lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <Header
        locale={locale}
        onLocaleChange={() => setLocale(locale === "en" ? "ar" : "en")}
        cart={cart}
      />
      <div className="wrap product-main">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/">{t.home}</Link>
          <span>/</span>
          <span>{locale === "ar" ? product.brandAr : product.brand}</span>
          <span>/</span>
          <span>{locale === "ar" ? product.nameAr : product.name}</span>
        </nav>
        <div className="product-row">
          <ProductGallery product={product} />
          <ProductDetails
            product={product}
            locale={locale}
            onAdd={(quantity) => setCart((count) => count + quantity)}
          />
        </div>
        <section className="panels">
          <div className="panel">
            <h2>{t.description}</h2>
            <p>{description}</p>
          </div>
          <div className="panel">
            <h2>{t.notes}</h2>
            <div>
              <strong>{t.top}:</strong>{" "}
              {locale === "ar" ? product.notes.topAr : product.notes.top}
            </div>
            <div>
              <strong>{t.heart}:</strong>{" "}
              {locale === "ar" ? product.notes.heartAr : product.notes.heart}
            </div>
            <div>
              <strong>{t.base}:</strong>{" "}
              {locale === "ar" ? product.notes.baseAr : product.notes.base}
            </div>
          </div>
        </section>
        <section className="related">
          <h2>{t.like}</h2>
          <div className="grid">
            {related.map((item) => (
              <ProductCard key={item.slug} product={item} locale={locale} />
            ))}
          </div>
        </section>
      </div>
      <Footer locale={locale} />
    </main>
  );
}

function CartIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 8h14l-1.2 11H6.2L5 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}
