"use client";

import Image from "next/image";
import Link from "next/link";
import {
  CreditCard,
  Minus,
  Plus,
  ShoppingBag,
  Store,
  Trash2,
  UserRound,
} from "lucide-react";
import { PageLoading } from "@/components/PageLoading";
import { formatIDR } from "@/lib/format";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const ready = useCartStore((s) => s.ready);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const user = useAuthStore((s) => s.user);
  const authReady = useAuthStore((s) => s.ready);
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
  const checkoutHref = user ? "/checkout" : "/login?next=/checkout";

  if (!ready || !authReady) {
    return <PageLoading label="Menyiapkan keranjang" variant="cart" />;
  }

  if (items.length === 0) {
    return (
      <div className="container-store cart-page">
        <nav className="cart-page__crumb" aria-label="Breadcrumb">
          <Link href="/">Beranda</Link>
          <span>/</span>
          <span>Keranjang</span>
        </nav>
        <div className="cart-empty">
          <div className="cart-empty__icon" aria-hidden>
            <ShoppingBag size={22} />
          </div>
          <h1 className="display">Keranjang masih kosong</h1>
          <p>Yuk mulai belanja liquid & device favoritmu.</p>
          <div className="cart-empty__actions">
            <Link href="/products" className="btn btn-primary">
              Jelajahi produk
            </Link>
            <Link href="/orders" className="btn btn-ghost">
              Lihat pesanan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-store cart-page">
      <nav className="cart-page__crumb" aria-label="Breadcrumb">
        <Link href="/">Beranda</Link>
        <span>/</span>
        <span>Keranjang</span>
      </nav>

      <header className="cart-head">
        <div className="cart-head__top">
          <div>
            <p className="section-kicker">Belanja</p>
            <h1 className="display cart-head__title">Keranjang</h1>
            <p className="cart-head__lead">
              Cek ulang item sebelum lanjut checkout — ongkir dihitung di langkah berikutnya.
            </p>
          </div>
          <div className="cart-head__stats">
            <div className="cart-stat-chip">
              <strong>{items.length}</strong>
              <span>Jenis</span>
            </div>
            <div className="cart-stat-chip">
              <strong>{totalQty}</strong>
              <span>Item</span>
            </div>
          </div>
        </div>
        <div className="cart-head__links">
          <Link href="/products" className="cart-head__link">
            <Store size={15} />
            Tambah produk
          </Link>
          <Link href={checkoutHref} className="cart-head__link">
            <CreditCard size={15} />
            {user ? "Checkout" : "Login & Checkout"}
          </Link>
          {user ? (
            <Link href="/profile" className="cart-head__link">
              <UserRound size={15} />
              {user.name?.trim() || "Profil"}
            </Link>
          ) : (
            <Link href="/login?next=/cart" className="cart-head__link">
              <UserRound size={15} />
              Masuk
            </Link>
          )}
        </div>
      </header>

      <div className="cart-layout">
        <div className="cart-list">
          {items.map((item) => (
            <article key={item.variantId} className="cart-item">
              <div className="cart-item__thumb">
                <Image src={item.image} alt={item.name} fill className="object-contain p-2" />
              </div>
              <div className="cart-item__body">
                <div className="cart-item__brand">{item.brand}</div>
                <Link href={`/product/${item.slug}`} className="cart-item__name">
                  {item.name}
                </Link>
                {item.nic && <div className="cart-item__meta">NIC {item.nic}</div>}
                <div className="cart-item__price">{formatIDR(item.price)}</div>
              </div>
              <div className="cart-item__actions">
                <div className="cart-qty">
                  <button
                    type="button"
                    aria-label="Kurangi"
                    onClick={() => void updateQty(item.variantId, item.qty - 1)}
                  >
                    <Minus size={14} />
                  </button>
                  <span>{item.qty}</span>
                  <button
                    type="button"
                    aria-label="Tambah"
                    onClick={() => void updateQty(item.variantId, item.qty + 1)}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="cart-item__line">
                  <span>Subtotal</span>
                  <strong>{formatIDR(item.lineTotal ?? item.price * item.qty)}</strong>
                </div>
                <button
                  type="button"
                  className="cart-item__remove"
                  onClick={() => void removeItem(item.variantId)}
                  aria-label="Hapus"
                >
                  <Trash2 size={15} />
                  Hapus
                </button>
              </div>
            </article>
          ))}
        </div>

        <aside className="cart-summary">
          <div className="cart-summary__head">
            <div className="cart-summary__icon" aria-hidden>
              <ShoppingBag size={16} />
            </div>
            <div>
              <h2 className="display">Ringkasan</h2>
              <p>{totalQty} item siap dibayar</p>
            </div>
          </div>
          <div className="cart-summary__rows">
            <div>
              <span>Subtotal</span>
              <strong>{formatIDR(subtotal)}</strong>
            </div>
            <div>
              <span>Ongkir</span>
              <em>Dihitung di checkout</em>
            </div>
          </div>
          <div className="cart-summary__total">
            <span>Total sementara</span>
            <strong>{formatIDR(subtotal)}</strong>
          </div>

          {!user && (
            <p className="cart-summary__note">
              Belum login. Saat checkout Anda akan diminta masuk — keranjang guest digabung otomatis.
            </p>
          )}

          <Link href={checkoutHref} className="btn btn-primary w-full">
            {user ? "Lanjut Checkout" : "Login & Checkout"}
          </Link>
          <Link href="/products" className="btn btn-ghost w-full">
            Tambah produk lain
          </Link>
        </aside>
      </div>
    </div>
  );
}
