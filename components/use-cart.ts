"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  addItem,
  type Cart,
  CART_STORAGE_KEY,
  cartCount,
  cartSubtotal,
  deserializeCart,
  emptyCart,
  quantityInCart,
  removeItem,
  resolveCart,
  sanitizeCart,
  serializeCart,
  updateQuantity,
} from "@/lib/cart";
import { useCatalog } from "@/components/catalog-context";

/*
 * A tiny external store that keeps the cart in localStorage. Every component
 * that calls useCart() sees the same cart, and other open tabs are kept in
 * sync through the browser's `storage` event.
 *
 * The store holds the lines as saved. useCart() then applies the current
 * catalog (unknown sizes dropped, quantities capped at stock).
 */
let cached: Cart | null = null;
const listeners = new Set<() => void>();

function readCart(): Cart {
  if (cached === null) {
    try {
      cached = deserializeCart(window.localStorage.getItem(CART_STORAGE_KEY));
    } catch {
      cached = emptyCart;
    }
  }
  return cached;
}

function writeCart(next: Cart) {
  if (next === cached) return;
  cached = next;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, serializeCart(next));
  } catch {
    // Storage can be full or blocked (private mode); keep the in-memory cart.
  }
  listeners.forEach((listener) => listener());
}

function onStorage(event: StorageEvent) {
  if (event.key !== null && event.key !== CART_STORAGE_KEY) return;
  cached = null;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

const getServerCart = () => emptyCart;
const noopSubscribe = () => () => {};

export function useCart() {
  const catalog = useCatalog();
  const stored = useSyncExternalStore(subscribe, readCart, getServerCart);
  const cart = useMemo(() => sanitizeCart(stored, catalog), [stored, catalog]);
  // False during server rendering and hydration, true once the stored cart
  // has been read. Lets pages avoid flashing an empty cart on reload.
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const lines = useMemo(() => resolveCart(cart, catalog), [cart, catalog]);

  const current = useCallback(
    () => sanitizeCart(readCart(), catalog),
    [catalog],
  );
  const add = useCallback((slug: string, ml: number, quantity = 1) => {
    const result = addItem(current(), slug, ml, quantity, catalog);
    writeCart(result.cart);
    return result.added;
  }, [catalog, current]);
  const setQuantity = useCallback(
    (slug: string, ml: number, quantity: number) =>
      writeCart(updateQuantity(current(), slug, ml, quantity, catalog)),
    [catalog, current],
  );
  const remove = useCallback(
    (slug: string, ml: number) => writeCart(removeItem(current(), slug, ml)),
    [current],
  );
  const inCart = useCallback(
    (slug: string, ml: number) => quantityInCart(cart, slug, ml),
    [cart],
  );

  return {
    hydrated,
    lines,
    count: cartCount(cart),
    subtotalHalalas: cartSubtotal(cart, catalog),
    add,
    setQuantity,
    remove,
    inCart,
  };
}
