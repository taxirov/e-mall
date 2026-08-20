"use client";

import { useCallback, useEffect, useState } from "react";

export type CartLine = { productId: string; name: string; price: number; qty: number; maxStock: number };

function storageKey(storeSlug: string) {
  return `emall-cart:${storeSlug}`;
}

export function useCart(storeSlug: string) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Reads localStorage (unavailable during SSR) after mount, so the first
    // client render intentionally matches the empty server render before
    // hydrating the real cart — avoids a hydration mismatch.
    const raw = localStorage.getItem(storageKey(storeSlug));
    if (raw) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCart(JSON.parse(raw));
      } catch {
        // ignore corrupt cart data
      }
    }
    setHydrated(true);
  }, [storeSlug]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(storageKey(storeSlug), JSON.stringify(cart));
  }, [cart, storeSlug, hydrated]);

  const addToCart = useCallback((product: { id: string; name: string; price: number; stock: number }) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      if (existing) {
        if (existing.qty >= product.stock) return prev;
        return prev.map((l) => (l.productId === product.id ? { ...l, qty: l.qty + 1 } : l));
      }
      if (product.stock < 1) return prev;
      return [...prev, { productId: product.id, name: product.name, price: product.price, qty: 1, maxStock: product.stock }];
    });
  }, []);

  const changeQty = useCallback((productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) => (l.productId === productId ? { ...l, qty: Math.min(l.maxStock, Math.max(0, l.qty + delta)) } : l))
        .filter((l) => l.qty > 0)
    );
  }, []);

  const removeLine = useCallback((productId: string) => {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const total = cart.reduce((sum, l) => sum + l.price * l.qty, 0);
  const itemCount = cart.reduce((sum, l) => sum + l.qty, 0);

  return { cart, addToCart, changeQty, removeLine, clearCart, total, itemCount, hydrated };
}
