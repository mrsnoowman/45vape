"use client";

import { useEffect } from "react";
import { AuthModal } from "@/components/AuthModal";
import { AgeGate } from "@/components/AgeGate";
import { CartDrawer } from "@/components/CartDrawer";
import { FlyToCartLayer, ToastStack } from "@/components/ToastFly";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { useUiStore } from "@/store/ui-store";
import { useWishlistStore } from "@/store/wishlist-store";

export function Providers({ children }: { children: React.ReactNode }) {
  const refreshAuth = useAuthStore((s) => s.refresh);
  const refreshCart = useCartStore((s) => s.refresh);
  const hydrateWishlist = useWishlistStore((s) => s.hydrate);
  const cartOpen = useUiStore((s) => s.cartOpen);
  const authOpen = useUiStore((s) => s.authOpen);

  useEffect(() => {
    hydrateWishlist();
    void (async () => {
      await refreshAuth();
      await refreshCart();
    })();
  }, [refreshAuth, refreshCart, hydrateWishlist]);

  useEffect(() => {
    const locked = cartOpen || authOpen;
    if (locked) document.body.style.overflow = "hidden";
    return () => {
      if (locked) document.body.style.overflow = "";
    };
  }, [cartOpen, authOpen]);

  return (
    <>
      {children}
      <AgeGate />
      <AuthModal />
      <CartDrawer />
      <ToastStack />
      <FlyToCartLayer />
    </>
  );
}
