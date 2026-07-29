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

type CartState = {
  items: CartLine[];
  subtotal: number;
  totalItems: number;
  loading: boolean;
  ready: boolean;
  refresh: () => Promise<void>;
  addItem: (variantId: number, qty?: number) => Promise<{ ok: boolean; message: string }>;
  updateQty: (variantId: number, qty: number) => Promise<{ ok: boolean; message: string }>;
  removeItem: (variantId: number) => Promise<{ ok: boolean; message: string }>;
};

async function readCart() {
  const res = await fetch("/api/cart", { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal memuat keranjang");
  return res.json() as Promise<{ items: CartLine[]; subtotal: number; totalItems: number }>;
}

export const useCartStore = create<CartState>((set) => ({
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
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId, qty }),
    });
    const data = await res.json();
    if (data.cart) {
      set({ ...data.cart, ready: true });
    }
    return { ok: Boolean(data.ok), message: data.message || "Gagal" };
  },
  updateQty: async (variantId, qty) => {
    const res = await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId, qty }),
    });
    const data = await res.json();
    if (data.cart) set({ ...data.cart, ready: true });
    return { ok: Boolean(data.ok), message: data.message || "Gagal" };
  },
  removeItem: async (variantId) => {
    const res = await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId }),
    });
    const data = await res.json();
    if (data.cart) set({ ...data.cart, ready: true });
    return { ok: Boolean(data.ok), message: data.message || "Gagal" };
  },
}));
