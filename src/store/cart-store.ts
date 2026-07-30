"use client";

import { create } from "zustand";

export type CartLine = {
  id: number;
  productId: number;
  variantId: number;
  slug: string;
  name: string;
  brand: string;
  image: string;
  nic: string | null;
  qty: number;
  stock: number;
  price: number;
  originalPrice: number;
  discountPercent: number;
  lineTotal: number;
};

type CartSnapshot = {
  items: CartLine[];
  subtotal: number;
  totalItems: number;
};

type CartState = CartSnapshot & {
  loading: boolean;
  ready: boolean;
  refresh: () => Promise<void>;
  addItem: (variantId: number, qty?: number) => Promise<{ ok: boolean; message: string }>;
  updateQty: (variantId: number, qty: number) => Promise<{ ok: boolean; message: string }>;
  removeItem: (variantId: number) => Promise<{ ok: boolean; message: string }>;
};

function summarize(items: CartLine[]): CartSnapshot {
  const next = items.map((item) => ({
    ...item,
    lineTotal: item.price * item.qty,
  }));
  return {
    items: next,
    subtotal: next.reduce((sum, i) => sum + i.lineTotal, 0),
    totalItems: next.reduce((sum, i) => sum + i.qty, 0),
  };
}

async function readCart() {
  const res = await fetch("/api/cart", { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal memuat keranjang");
  return res.json() as Promise<CartSnapshot>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  subtotal: 0,
  totalItems: 0,
  loading: false,
  ready: false,
  refresh: async () => {
    set({ loading: true });
    try {
      const cart = await readCart();
      set({ ...cart, ready: true, loading: false });
    } catch {
      set({ loading: false, ready: true });
    }
  },
  addItem: async (variantId, qty = 1) => {
    const prev = {
      items: get().items,
      subtotal: get().subtotal,
      totalItems: get().totalItems,
    };
    const existing = prev.items.find((i) => i.variantId === variantId);
    if (existing) {
      const nextQty = Math.min(existing.stock, existing.qty + qty);
      set(
        summarize(
          prev.items.map((i) => (i.variantId === variantId ? { ...i, qty: nextQty } : i))
        )
      );
    }

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, qty }),
      });
      const data = await res.json();
      if (data.cart) {
        set({ ...data.cart, ready: true });
      } else if (!data.ok) {
        set(prev);
      }
      return { ok: Boolean(data.ok), message: data.message || "Gagal" };
    } catch {
      set(prev);
      return { ok: false, message: "Gagal menambah ke keranjang" };
    }
  },
  updateQty: async (variantId, qty) => {
    const prev = {
      items: get().items,
      subtotal: get().subtotal,
      totalItems: get().totalItems,
    };
    const target = prev.items.find((i) => i.variantId === variantId);
    if (!target) return { ok: false, message: "Item tidak ditemukan" };

    if (qty <= 0) {
      set(summarize(prev.items.filter((i) => i.variantId !== variantId)));
    } else {
      const nextQty = Math.min(target.stock, qty);
      set(
        summarize(
          prev.items.map((i) => (i.variantId === variantId ? { ...i, qty: nextQty } : i))
        )
      );
    }

    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, qty }),
      });
      const data = await res.json();
      if (data.cart) {
        set({ ...data.cart, ready: true });
      } else if (!data.ok) {
        set(prev);
      }
      return { ok: Boolean(data.ok), message: data.message || "Gagal" };
    } catch {
      set(prev);
      return { ok: false, message: "Gagal mengubah jumlah" };
    }
  },
  removeItem: async (variantId) => {
    const prev = {
      items: get().items,
      subtotal: get().subtotal,
      totalItems: get().totalItems,
    };
    set(summarize(prev.items.filter((i) => i.variantId !== variantId)));

    try {
      const res = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId }),
      });
      const data = await res.json();
      if (data.cart) {
        set({ ...data.cart, ready: true });
      } else if (!data.ok) {
        set(prev);
      }
      return { ok: Boolean(data.ok), message: data.message || "Gagal" };
    } catch {
      set(prev);
      return { ok: false, message: "Gagal menghapus item" };
    }
  },
}));
