"use client";

import { create } from "zustand";
import { useCartStore, type CartLine } from "@/store/cart-store";

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  role?: "member" | "admin";
  profileComplete?: boolean;
  profileCompletion?: number;
};

type CartPayload = {
  items: CartLine[];
  subtotal: number;
  totalItems: number;
};

type AuthState = {
  user: AuthUser | null;
  ready: boolean;
  refresh: () => Promise<void>;
  login: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; message: string; cart?: CartPayload }>;
  register: (
    email: string,
    password: string,
    confirmPassword: string
  ) => Promise<{ ok: boolean; message: string; cart?: CartPayload }>;
  logout: () => Promise<void>;
  updateProfile: (data: {
    name: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
  }) => Promise<{ ok: boolean; message: string }>;
};

function applyCart(cart?: CartPayload) {
  if (!cart) return;
  useCartStore.setState({ ...cart, ready: true, loading: false });
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  ready: false,
  refresh: async () => {
    try {
      const res = await fetch("/api/auth", { cache: "no-store" });
      const data = await res.json();
      set({ user: data.user ?? null, ready: true });
    } catch {
      set({ user: null, ready: true });
    }
  },
  login: async (email, password) => {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", email, password }),
    });
    const data = await res.json();
    if (data.ok) {
      set({ user: data.user });
      applyCart(data.cart);
    }
    return { ok: Boolean(data.ok), message: data.message || "Gagal login", cart: data.cart };
  },
  register: async (email, password, confirmPassword) => {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register", email, password, confirmPassword }),
    });
    const data = await res.json();
    if (data.ok) {
      set({ user: data.user });
      applyCart(data.cart);
    }
    return { ok: Boolean(data.ok), message: data.message || "Gagal daftar", cart: data.cart };
  },
  logout: async () => {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    set({ user: null });
    useCartStore.setState({ items: [], subtotal: 0, totalItems: 0, ready: true });
  },
  updateProfile: async (payload) => {
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.ok) set({ user: data.user });
    return { ok: Boolean(data.ok), message: data.message || "Gagal simpan" };
  },
}));
