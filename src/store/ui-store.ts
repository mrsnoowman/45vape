"use client";

import { create } from "zustand";

type AuthTab = "login" | "register";

type ToastItem = {
  id: string;
  title: string;
  subtitle?: string;
  tone?: "success" | "info" | "error";
};

type FlyPayload = {
  id: string;
  image: string;
  fromX: number;
  fromY: number;
};

type UiState = {
  authOpen: boolean;
  authTab: AuthTab;
  authNext: string | null;
  cartOpen: boolean;
  toasts: ToastItem[];
  flyItems: FlyPayload[];
  openAuth: (tab?: AuthTab, next?: string | null) => void;
  closeAuth: () => void;
  setAuthTab: (tab: AuthTab) => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  pushToast: (toast: Omit<ToastItem, "id">) => void;
  dismissToast: (id: string) => void;
  flyToCart: (payload: Omit<FlyPayload, "id">) => void;
  clearFly: (id: string) => void;
};

export const useUiStore = create<UiState>((set, get) => ({
  authOpen: false,
  authTab: "login",
  authNext: null,
  cartOpen: false,
  toasts: [],
  flyItems: [],
  openAuth: (tab = "login", next = null) =>
    set({ authOpen: true, authTab: tab, authNext: next, cartOpen: false }),
  closeAuth: () => set({ authOpen: false, authNext: null }),
  setAuthTab: (tab) => set({ authTab: tab }),
  openCart: () => set({ cartOpen: true, authOpen: false }),
  closeCart: () => set({ cartOpen: false }),
  toggleCart: () => set({ cartOpen: !get().cartOpen }),
  pushToast: (toast) => {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    set({ toasts: [...get().toasts, { ...toast, id }] });
    window.setTimeout(() => get().dismissToast(id), 2800);
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  flyToCart: (payload) => {
    const cartBtn = document.getElementById("header-cart-btn");
    const cartRect = cartBtn?.getBoundingClientRect();
    if (cartRect) {
      document.documentElement.style.setProperty(
        "--cart-target-x",
        `${cartRect.left + cartRect.width / 2}px`
      );
      document.documentElement.style.setProperty(
        "--cart-target-y",
        `${cartRect.top + cartRect.height / 2}px`
      );
    }
    const id = `f_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    set({ flyItems: [...get().flyItems, { ...payload, id }] });
    window.setTimeout(() => get().clearFly(id), 900);
  },
  clearFly: (id) => set({ flyItems: get().flyItems.filter((f) => f.id !== id) }),
}));
