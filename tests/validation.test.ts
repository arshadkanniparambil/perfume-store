import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { money } from "../lib/catalog.ts";
import { sampleProducts } from "../lib/sample-catalog.ts";
import {
  cartValidationRequest,
  parseCatalog,
  validateCart,
} from "../lib/validation.ts";

describe("money", () => {
  test("formats integer halalas", () => {
    assert.equal(money(4900, "en"), "SAR 49");
    assert.equal(money(4950, "en"), "SAR 49.50");
    assert.equal(money(5, "en"), "SAR 0.05");
    assert.equal(money(0, "en"), "SAR 0");
    assert.equal(money(13900, "ar"), "139 ر.س");
  });
});

describe("cart validation request", () => {
  const ok = { items: [{ slug: "afnan-9pm", ml: 50, quantity: 2 }] };

  test("accepts a well-formed cart", () => {
    assert.ok(cartValidationRequest.safeParse(ok).success);
    assert.ok(cartValidationRequest.safeParse({ items: [] }).success);
  });

  const bad: [string, unknown][] = [
    ["not an object", "afnan-9pm"],
    ["missing items", {}],
    ["fractional quantity", { items: [{ slug: "afnan-9pm", ml: 50, quantity: 1.5 }] }],
    ["zero quantity", { items: [{ slug: "afnan-9pm", ml: 50, quantity: 0 }] }],
    ["huge quantity", { items: [{ slug: "afnan-9pm", ml: 50, quantity: 1000 }] }],
    ["quantity as text", { items: [{ slug: "afnan-9pm", ml: 50, quantity: "2" }] }],
    ["bad slug", { items: [{ slug: "<script>", ml: 50, quantity: 1 }] }],
    ["negative size", { items: [{ slug: "afnan-9pm", ml: -50, quantity: 1 }] }],
    // A client must not be able to send its own price.
    ["extra price field", {
      items: [{ slug: "afnan-9pm", ml: 50, quantity: 1, priceHalalas: 1 }],
    }],
    ["too many lines", {
      items: Array.from({ length: 51 }, (_, i) => ({ slug: `p-${i}`, ml: 50, quantity: 1 })),
    }],
  ];
  for (const [label, body] of bad) {
    test(`rejects ${label}`, () => {
      assert.equal(cartValidationRequest.safeParse(body).success, false);
    });
  }
});

describe("validateCart", () => {
  test("prices lines from the catalog and totals them", () => {
    const result = validateCart([
      { slug: "afnan-9pm", ml: 30, quantity: 2 },
      { slug: "afnan-9pm", ml: 100, quantity: 1 },
    ], sampleProducts);
    assert.equal(result.valid, true);
    assert.equal(result.subtotalHalalas, 2 * 4900 + 13900);
    assert.equal(result.itemCount, 3);
    assert.deepEqual(result.items.map((line) => line.sku), [
      "AFNAN-9PM-30ML",
      "AFNAN-9PM-100ML",
    ]);
  });

  test("caps quantities at stock and flags missing or sold-out items", () => {
    const result = validateCart([
      { slug: "lattafa-khamrah", ml: 100, quantity: 5 }, // stock 2
      { slug: "ahmed-al-maghribi-ignite", ml: 100, quantity: 1 }, // stock 0
      { slug: "afnan-9pm", ml: 75, quantity: 1 }, // no such size
    ], sampleProducts);
    assert.equal(result.valid, false);
    assert.deepEqual(
      result.items.map((line) => [line.status, line.quantity]),
      [["reduced", 2], ["out_of_stock", 0], ["not_found", 0]],
    );
    assert.equal(result.subtotalHalalas, 2 * 12900);
  });

  test("merges duplicate lines before checking stock", () => {
    const result = validateCart([
      { slug: "afnan-9pm", ml: 30, quantity: 2 },
      { slug: "afnan-9pm", ml: 30, quantity: 2 }, // stock 3
    ], sampleProducts);
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].quantity, 3);
    assert.equal(result.items[0].status, "reduced");
  });
});

describe("parseCatalog", () => {
  const row = {
    slug: "test-product",
    nameEn: "Test",
    nameAr: "تجربة",
    descriptionEn: "",
    descriptionAr: "",
    concentration: "Eau de Parfum",
    notes: { topEn: "", heartEn: "", baseEn: "", topAr: "", heartAr: "", baseAr: "" },
    accentColor: "#123456",
    brand: { slug: "brand", nameEn: "Brand", nameAr: "ماركة" },
    categories: [],
    variants: [
      { sku: "T-100ML", sizeMl: 100, priceHalalas: 10000, stock: 1 },
      { sku: "T-50ML", sizeMl: 50, priceHalalas: 6000, stock: 0 },
    ],
    images: [{ url: "https://example.com/t.jpg", altEn: "Test", altAr: "تجربة" }],
  };

  test("maps rows and sorts sizes small to large", () => {
    const [product] = parseCatalog([row]);
    assert.deepEqual(product.sizes.map((size) => size.ml), [50, 100]);
    assert.equal(product.images[0].alt, "Test");
    assert.equal(product.tone, "#123456");
  });

  test("drops products with no sellable size", () => {
    assert.deepEqual(parseCatalog([{ ...row, variants: [] }]), []);
  });

  test("rejects fractional or missing prices", () => {
    const fractional = {
      ...row,
      variants: [{ sku: "T", sizeMl: 50, priceHalalas: 49.5, stock: 1 }],
    };
    assert.throws(() => parseCatalog([fractional]));
    assert.throws(() => parseCatalog([{ ...row, variants: [{ sku: "T", sizeMl: 50 }] }]));
    assert.throws(() => parseCatalog({ not: "an array" }));
  });
});
