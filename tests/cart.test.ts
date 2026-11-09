import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { type Product, products } from "../lib/catalog.ts";
import {
  addItem,
  type Cart,
  cartCount,
  cartSubtotal,
  deserializeCart,
  emptyCart,
  lineId,
  quantityInCart,
  remainingStock,
  removeItem,
  resolveCart,
  sanitizeCart,
  serializeCart,
  updateQuantity,
} from "../lib/cart.ts";

// A small fixed catalog so tests don't depend on the store's real stock levels.
const base = products[0];
const catalog: Product[] = [
  {
    ...base,
    slug: "multi",
    name: "Multi",
    tone: "#111111",
    sizes: [
      { ml: 30, price: 49, stock: 3 },
      { ml: 50, price: 89, stock: 8 },
      { ml: 100, price: 139, stock: 12 },
    ],
  },
  {
    ...base,
    slug: "single",
    name: "Single",
    tone: "#222222",
    sizes: [{ ml: 100, price: 129, stock: 2 }],
  },
  {
    ...base,
    slug: "soldout",
    name: "Sold out",
    tone: "#333333",
    sizes: [{ ml: 100, price: 149, stock: 0 }],
  },
];

const add = (cart: Cart, slug: string, ml: number, qty = 1) =>
  addItem(cart, slug, ml, qty, catalog);

describe("adding products", () => {
  test("adds a new line for a variant", () => {
    const { cart, added } = add(emptyCart, "multi", 50, 2);
    assert.equal(added, 2);
    assert.deepEqual(cart, [{ slug: "multi", ml: 50, quantity: 2 }]);
  });

  test("adding the same variant again increases its quantity", () => {
    let cart = add(emptyCart, "multi", 50).cart;
    cart = add(cart, "multi", 50, 3).cart;
    assert.deepEqual(cart, [{ slug: "multi", ml: 50, quantity: 4 }]);
  });

  test("a different size of the same product becomes a separate line", () => {
    let cart = add(emptyCart, "multi", 100).cart;
    cart = add(cart, "multi", 30).cart;
    cart = add(cart, "multi", 50, 2).cart;
    assert.equal(cart.length, 3);
    assert.deepEqual(
      cart.map((line) => lineId(line.slug, line.ml)),
      ["multi::100", "multi::30", "multi::50"],
    );
    assert.equal(quantityInCart(cart, "multi", 30), 1);
    assert.equal(quantityInCart(cart, "multi", 50), 2);
    assert.equal(quantityInCart(cart, "multi", 100), 1);
  });

  test("ignores unknown products, unknown sizes and invalid quantities", () => {
    assert.equal(add(emptyCart, "nope", 100).added, 0);
    assert.equal(add(emptyCart, "multi", 75).added, 0);
    assert.equal(add(emptyCart, "multi", 50, 0).added, 0);
    assert.equal(add(emptyCart, "multi", 50, -2).added, 0);
    assert.equal(add(emptyCart, "multi", 50, Number.NaN).added, 0);
    assert.equal(add(emptyCart, "multi", 50, 0).cart, emptyCart);
  });

  test("does not mutate the previous cart", () => {
    const first = add(emptyCart, "multi", 50).cart;
    const snapshot = structuredClone(first);
    add(first, "multi", 50, 2);
    assert.deepEqual(first, snapshot);
  });
});

describe("stock limits", () => {
  test("adding more than stock adds only what is available", () => {
    const { cart, added } = add(emptyCart, "multi", 30, 10);
    assert.equal(added, 3);
    assert.equal(quantityInCart(cart, "multi", 30), 3);
  });

  test("stock counts what is already in the cart", () => {
    let cart = add(emptyCart, "single", 100).cart;
    assert.equal(remainingStock(cart, "single", 100, catalog), 1);
    const second = add(cart, "single", 100, 5);
    assert.equal(second.added, 1);
    cart = second.cart;
    const third = add(cart, "single", 100);
    assert.equal(third.added, 0);
    assert.equal(third.cart, cart);
    assert.equal(quantityInCart(cart, "single", 100), 2);
  });

  test("stock is tracked per size", () => {
    const cart = add(emptyCart, "multi", 30, 3).cart;
    assert.equal(remainingStock(cart, "multi", 30, catalog), 0);
    assert.equal(remainingStock(cart, "multi", 50, catalog), 8);
    assert.equal(add(cart, "multi", 50, 8).added, 8);
  });

  test("out-of-stock variants cannot be added", () => {
    const { cart, added } = add(emptyCart, "soldout", 100);
    assert.equal(added, 0);
    assert.equal(cart.length, 0);
  });
});

describe("changing quantity", () => {
  const start = add(add(emptyCart, "multi", 50, 2).cart, "multi", 30).cart;

  test("sets the quantity of the matching line only", () => {
    const cart = updateQuantity(start, "multi", 50, 5, catalog);
    assert.equal(quantityInCart(cart, "multi", 50), 5);
    assert.equal(quantityInCart(cart, "multi", 30), 1);
  });

  test("clamps to available stock", () => {
    const cart = updateQuantity(start, "multi", 30, 99, catalog);
    assert.equal(quantityInCart(cart, "multi", 30), 3);
  });

  test("zero or less removes the line", () => {
    assert.equal(
      quantityInCart(updateQuantity(start, "multi", 50, 0, catalog), "multi", 50),
      0,
    );
    assert.equal(updateQuantity(start, "multi", 50, -1, catalog).length, 1);
  });

  test("does not create a line that is not in the cart", () => {
    assert.equal(updateQuantity(start, "multi", 100, 4, catalog), start);
  });
});

describe("removing products", () => {
  test("removes only the chosen size", () => {
    let cart = add(emptyCart, "multi", 30).cart;
    cart = add(cart, "multi", 100).cart;
    cart = removeItem(cart, "multi", 30);
    assert.deepEqual(cart, [{ slug: "multi", ml: 100, quantity: 1 }]);
  });

  test("removing the last item leaves an empty cart", () => {
    const cart = removeItem(add(emptyCart, "single", 100).cart, "single", 100);
    assert.equal(cart.length, 0);
    assert.equal(cartCount(cart), 0);
    assert.equal(cartSubtotal(cart, catalog), 0);
  });
});

describe("totals and display data", () => {
  let cart = add(emptyCart, "multi", 30, 2).cart; // 2 × 49
  cart = add(cart, "multi", 100).cart; // 1 × 139
  cart = add(cart, "single", 100, 2).cart; // 2 × 129

  test("item count is the total number of units", () => {
    assert.equal(cartCount(cart), 5);
  });

  test("subtotal uses each size's own price", () => {
    assert.equal(cartSubtotal(cart, catalog), 2 * 49 + 139 + 2 * 129);
  });

  test("resolved lines carry the right product, image tone, size and price", () => {
    const lines = resolveCart(cart, catalog);
    const small = lines.find((line) => line.id === "multi::30")!;
    assert.equal(small.product.name, "Multi");
    assert.equal(small.product.tone, "#111111");
    assert.equal(small.size.ml, 30);
    assert.equal(small.unitPrice, 49);
    assert.equal(small.lineTotal, 98);
    const large = lines.find((line) => line.id === "multi::100")!;
    assert.equal(large.size.ml, 100);
    assert.equal(large.unitPrice, 139);
    const single = lines.find((line) => line.id === "single::100")!;
    assert.equal(single.product.tone, "#222222");
    assert.equal(single.lineTotal, 258);
  });

  test("prices come from the catalog, not from stored data", () => {
    const repriced = catalog.map((product) =>
      product.slug === "multi"
        ? {
          ...product,
          sizes: product.sizes.map((size) => ({ ...size, price: size.price + 1 })),
        }
        : product
    );
    assert.equal(cartSubtotal(cart, repriced), 2 * 50 + 140 + 2 * 129);
  });
});

describe("persistence", () => {
  test("serialize → deserialize round-trips the cart", () => {
    let cart = add(emptyCart, "multi", 30, 2).cart;
    cart = add(cart, "multi", 100).cart;
    const restored = deserializeCart(serializeCart(cart), catalog);
    assert.deepEqual(restored, cart);
  });

  test("serialized data stores only variant ids and quantities", () => {
    const cart = add(emptyCart, "multi", 50).cart;
    assert.deepEqual(JSON.parse(serializeCart(cart)), [
      { slug: "multi", ml: 50, quantity: 1 },
    ]);
  });

  test("missing or corrupt storage gives an empty cart", () => {
    assert.deepEqual(deserializeCart(null, catalog), []);
    assert.deepEqual(deserializeCart("", catalog), []);
    assert.deepEqual(deserializeCart("{not json", catalog), []);
    assert.deepEqual(deserializeCart('{"slug":"multi"}', catalog), []);
  });

  test("sanitizing drops bad lines, merges duplicates and clamps to stock", () => {
    const cart = sanitizeCart([
      { slug: "multi", ml: 50, quantity: 2 },
      { slug: "multi", ml: 50, quantity: 3 },
      { slug: "multi", ml: 30, quantity: 50 },
      { slug: "multi", ml: 75, quantity: 1 },
      { slug: "gone", ml: 100, quantity: 1 },
      { slug: "soldout", ml: 100, quantity: 1 },
      { slug: "single", ml: "100", quantity: 1 },
      null,
      "junk",
    ], catalog);
    assert.deepEqual(cart, [
      { slug: "multi", ml: 50, quantity: 5 },
      { slug: "multi", ml: 30, quantity: 3 },
    ]);
  });
});

describe("store catalog", () => {
  test("every size has a non-negative integer stock", () => {
    for (const product of products) {
      for (const size of product.sizes) {
        assert.ok(
          Number.isInteger(size.stock) && size.stock >= 0,
          `${product.slug} ${size.ml} ml`,
        );
      }
    }
  });

  test("works against the real catalog by default", () => {
    const { cart } = addItem(emptyCart, "afnan-9pm", 30);
    assert.equal(cartSubtotal(cart), 49);
    assert.equal(resolveCart(cart)[0].size.ml, 30);
  });
});
