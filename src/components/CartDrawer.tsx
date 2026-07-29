"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { formatIDR } from "@/lib/format";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { useUiStore } from "@/store/ui-store";

export function CartDrawer() {
  const open = useUiStore((s) => s.cartOpen);
  const closeCart = useUiStore((s) => s.closeCart);
  const openAuth = useUiStore((s) => s.openAuth);
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const user = useAuthStore((s) => s.user);
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className={`cart-drawer ${open ? "is-open" : ""}`} aria-hidden={!open}>
      <button
        type="button"
        className="cart-drawer__backdrop"
        aria-label="Tutup keranjang"
        onClick={closeCart}
      />
      <aside className="cart-drawer__panel" role="dialog" aria-label="Keranjang belanja">
        <header className="cart-drawer__head">
          <div className="cart-drawer__head-copy">
            <div className="cart-drawer__mark" aria-hidden>
              <ShoppingBag size={16} />
            </div>
            <div>
              <p className="cart-drawer__eyebrow">Keranjang</p>
              <h2 className="display cart-drawer__title">
                {items.length ? `${totalQty} item` : "Masih kosong"}
              </h2>
            </div>
          </div>
          <button
            type="button"
            className="cart-drawer__close"
            onClick={closeCart}
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </header>

        <div className="cart-drawer__body">
          {items.length === 0 ? (
            <div className="cart-drawer__empty">
              <div className="cart-drawer__empty-icon">
                <ShoppingBag size={26} />
              </div>
              <p className="cart-drawer__empty-title">Belum ada item</p>
              <p className="cart-drawer__empty-text">
                Tambahkan liquid atau device favoritmu.
              </p>
              <button type="button" className="btn btn-primary mt-5" onClick={closeCart}>
                Lanjut belanja
              </button>
            </div>
          ) : (
            <ul className="cart-drawer__list">
              {items.map((item, idx) => (
                <li
                  key={item.variantId}
                  className="cart-drawer__item"
                  style={{ animationDelay: `${idx * 45}ms` }}
                >
                  <div className="cart-drawer__thumb">
                    <Image src={item.image} alt={item.name} fill className="object-contain p-1.5" />
                  </div>
                  <div className="cart-drawer__info">
                    <div className="cart-drawer__top">
                      <Link
                        href={`/product/${item.slug}`}
                        className="cart-drawer__name"
                        onClick={closeCart}
                      >
                        {item.name}
                      </Link>
                      {item.nic ? <div className="cart-drawer__meta">NIC {item.nic}</div> : null}
                    </div>
                    <div className="cart-drawer__bottom">
                      <div className="cart-drawer__price">{formatIDR(item.price)}</div>
                      <div className="cart-drawer__controls">
                        <div className="cart-drawer__qty">
                          <button
                            type="button"
                            aria-label="Kurangi"
                            onClick={() => void updateQty(item.variantId, item.qty - 1)}
                          >
                            <Minus size={13} />
                          </button>
                          <span>{item.qty}</span>
                          <button
                            type="button"
                            aria-label="Tambah"
                            onClick={() => void updateQty(item.variantId, item.qty + 1)}
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <button
                          type="button"
                          className="cart-drawer__remove"
                          onClick={() => void removeItem(item.variantId)}
                          aria-label="Hapus"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="cart-drawer__foot">
            <div className="cart-drawer__total">
              <span>Subtotal</span>
              <strong>{formatIDR(subtotal)}</strong>
            </div>
            {!user && (
              <p className="cart-drawer__note">
                Belum login — saat checkout Anda diminta masuk, keranjang tetap aman.
              </p>
            )}
            <Link
              href={user ? "/checkout" : "#"}
              className="btn btn-primary w-full"
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  closeCart();
                  openAuth("login", "/checkout");
                  return;
                }
                closeCart();
              }}
            >
              {user ? "Lanjut Checkout" : "Login & Checkout"}
            </Link>
            <Link href="/cart" className="btn btn-ghost w-full" onClick={closeCart}>
              Lihat halaman keranjang
            </Link>
          </footer>
        )}
      </aside>
    </div>
  );
}
