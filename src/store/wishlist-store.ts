"use client";

import { create } from "zustand";

const STORAGE_KEY = "45vape_wishlist";

type WishlistState = {
  ids: number[];
  ready: boolean;
  hydrate: () => void;
  toggle: (productId: number) => { added: boolean };
  has: (productId: number) => boolean;
};

function readIds(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(Number).filter((id) => Number.isFinite(id) && id > 0);
  } catch {
    return [];
  }
}

function writeIds(ids: number[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* ignore quota / private mode */
  }
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  ids: [],
  ready: false,
  hydrate: () => {
    set({ ids: readIds(), ready: true });
  },
  toggle: (productId) => {
    const current = get().ids;
    const exists = current.includes(productId);
    const next = exists ? current.filter((id) => id !== productId) : [...current, productId];
    writeIds(next);
    set({ ids: next, ready: true });
    return { added: !exists };
  },
  has: (productId) => get().ids.includes(productId),
}));
