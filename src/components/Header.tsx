"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  Home,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Menu,
  Package,
  ShoppingBag,
  User,
  UserRound,
  X,
} from "lucide-react";
import { NAV_CATEGORIES } from "@/lib/catalog-meta";
import { HeaderSearch } from "@/components/HeaderSearch";
import { useCartStore } from "@/store/cart-store";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";

function displayName(user: { name: string; email: string }) {
  const name = user.name?.trim();
  if (name) return name.split(/\s+/)[0];
  const local = user.email.split("@")[0] || "Akun";
  return local;
}

function HeaderNav() {
  const pathname = usePathname();
  const search = useSearchParams();
  const category = search.get("category");
  const subcategory = search.get("subcategory");

  const allActive = pathname === "/products" && !category && !search.get("brand") && !search.get("q");
  const ordersActive = pathname.startsWith("/orders");
  const contactActive = pathname.startsWith("/kontak");

  return (
    <nav className="site-header__nav" aria-label="Kategori">
      <div className="nav-mega">
        <Link href="/products" className={`nav-link ${allActive ? "is-active" : ""}`}>
          Semua
        </Link>

        {NAV_CATEGORIES.map((cat) => {
          const active = pathname.startsWith("/products") && category === cat.slug;
          return (
            <div key={cat.slug} className={`nav-mega__item ${active ? "is-active" : ""}`}>
              <Link
                href={cat.href}
                className={`nav-link nav-mega__trigger ${active ? "is-active" : ""}`}
                aria-haspopup="true"
              >
                {cat.label}
                <ChevronDown size={13} strokeWidth={2.4} className="nav-mega__chev" aria-hidden />
              </Link>

              <div className="nav-mega__panel" role="menu" aria-label={`Subkategori ${cat.label}`}>
                <div className="nav-mega__panel-head">
                  <div>
                    <strong>{cat.label}</strong>
                    <span>{cat.description}</span>
                  </div>
                  <Link href={cat.href} className="nav-mega__all">
                    Lihat semua
                  </Link>
                </div>
                <ul className="nav-mega__list">
                  {cat.subs.map((sub) => {
                    const href = `/products?category=${cat.slug}&subcategory=${sub.slug}`;
                    const subActive = active && subcategory === sub.slug;
                    return (
                      <li key={sub.slug}>
                        <Link
                          href={href}
                          className={`nav-mega__link ${subActive ? "is-active" : ""}`}
                          role="menuitem"
                        >
                          {sub.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      <div className="nav-utils">
        <Link
          href="/kontak"
          className={`nav-link nav-link--util ${contactActive ? "is-active" : ""}`}
        >
          <MapPinned size={15} strokeWidth={2.4} />
          Kontak
        </Link>

        <Link
          href="/orders"
          className={`nav-link nav-link--util ${ordersActive ? "is-active" : ""}`}
        >
          <Package size={15} strokeWidth={2.4} />
          Status pesanan
        </Link>
      </div>
    </nav>
  );
}

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [openMobileCat, setOpenMobileCat] = useState<string | null>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const totalItems = useCartStore((s) => s.totalItems);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const refreshCart = useCartStore((s) => s.refresh);
  const openCart = useUiStore((s) => s.openCart);
  const openAuth = useUiStore((s) => s.openAuth);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
    setOpenMobileCat(null);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!accountOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (!accountRef.current?.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAccountOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const syncHeaderHeight = () => {
      const height = Math.ceil(el.getBoundingClientRect().height);
      document.documentElement.style.setProperty("--site-header-height", `${height}px`);
    };

    syncHeaderHeight();
    const observer = new ResizeObserver(syncHeaderHeight);
    observer.observe(el);
    window.addEventListener("resize", syncHeaderHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncHeaderHeight);
    };
  }, [pathname, mounted]);
  const badge = totalItems > 99 ? "99+" : String(totalItems);
  const nameLabel = user ? displayName(user) : "";

  const onLogout = async () => {
    setAccountOpen(false);
    setMenuOpen(false);
    await logout();
    await refreshCart();
    window.location.href = "/";
  };

  const mobileMenu =
    mounted &&
    menuOpen &&
    createPortal(
      <div className="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu">
        <button
          type="button"
          className="mobile-menu__backdrop"
          aria-label="Tutup menu"
          onClick={() => setMenuOpen(false)}
        />
        <aside className="mobile-menu__panel">
          <header className="mobile-menu__head">
            <div>
              <p className="mobile-menu__eyebrow">45 Vape</p>
              <strong className="display mobile-menu__title">Menu</strong>
            </div>
            <button
              type="button"
              className="mobile-menu__close"
              aria-label="Tutup"
              onClick={() => setMenuOpen(false)}
            >
              <X size={18} />
            </button>
          </header>

          <div className="mobile-menu__body">
            {user ? (
              <div className="mobile-menu__member">
                <span>Member</span>
                <strong>{user.name?.trim() || nameLabel}</strong>
                <em>{user.email}</em>
              </div>
            ) : (
              <button
                type="button"
                className="mobile-menu__login"
                onClick={() => {
                  setMenuOpen(false);
                  openAuth("login");
                }}
              >
                <User size={16} />
                Masuk / Daftar
              </button>
            )}

            <section className="mobile-menu__section">
              <h3>Navigasi</h3>
              <nav className="mobile-menu__list">
                <Link href="/" className="mobile-menu__link" onClick={() => setMenuOpen(false)}>
                  <Home size={16} />
                  Beranda
                </Link>
                <Link
                  href="/kontak"
                  className="mobile-menu__link"
                  onClick={() => setMenuOpen(false)}
                >
                  <MapPinned size={16} />
                  Kontak & Cabang
                </Link>
                <Link
                  href="/orders"
                  className="mobile-menu__link"
                  onClick={() => setMenuOpen(false)}
                >
                  <Package size={16} />
                  Status pesanan
                </Link>
                {user && (
                  <Link
                    href="/profile"
                    className="mobile-menu__link"
                    onClick={() => setMenuOpen(false)}
                  >
                    <UserRound size={16} />
                    Profil
                  </Link>
                )}
                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    className="mobile-menu__link"
                    onClick={() => setMenuOpen(false)}
                  >
                    <LayoutDashboard size={16} />
                    Admin panel
                  </Link>
                )}
              </nav>
            </section>

            <section className="mobile-menu__section">
              <h3>Kategori</h3>
              <div className="mobile-menu__cats">
                <Link
                  href="/products"
                  className="mobile-menu__link mobile-menu__link--cat"
                  onClick={() => setMenuOpen(false)}
                >
                  <span>
                    <strong>Semua</strong>
                    <small>Katalog lengkap</small>
                  </span>
                </Link>

                {NAV_CATEGORIES.map((cat) => {
                  const open = openMobileCat === cat.slug;
                  return (
                    <div key={cat.slug} className={`mobile-cat ${open ? "is-open" : ""}`}>
                      <div className="mobile-cat__row">
                        <Link
                          href={cat.href}
                          className="mobile-cat__main"
                          onClick={() => setMenuOpen(false)}
                        >
                          <strong>{cat.label}</strong>
                          <small>{cat.description}</small>
                        </Link>
                        <button
                          type="button"
                          className="mobile-cat__toggle"
                          aria-expanded={open}
                          aria-label={`${open ? "Tutup" : "Buka"} ${cat.label}`}
                          onClick={() =>
                            setOpenMobileCat((prev) => (prev === cat.slug ? null : cat.slug))
                          }
                        >
                          <ChevronDown size={16} />
                        </button>
                      </div>
                      {open && (
                        <div className="mobile-cat__subs">
                          {cat.subs.map((sub) => (
                            <Link
                              key={sub.slug}
                              href={`/products?category=${cat.slug}&subcategory=${sub.slug}`}
                              className="mobile-cat__sub"
                              onClick={() => setMenuOpen(false)}
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {user && (
            <footer className="mobile-menu__foot">
              <button type="button" className="mobile-menu__logout" onClick={() => void onLogout()}>
                <LogOut size={15} />
                Keluar
              </button>
            </footer>
          )}
        </aside>
      </div>,
      document.body,
    );

  return (
    <header ref={headerRef} className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="container-store">
        <div className="site-header__top">
          <div className="site-header__brand">
            <button
              type="button"
              className="site-header__menu-btn btn btn-ghost"
              aria-label="Menu"
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={18} />
            </button>
            <Link href="/" className="brand-mark">
              <Image
                src="/brand/IMG_3820.PNG"
                alt="45 Vape"
                width={44}
                height={44}
                className="h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11"
                priority
              />
              <div className="brand-mark__text">
                <div className="brand-mark__name">45 Vape</div>
                <div className="brand-mark__sub">Official Store</div>
              </div>
            </Link>
          </div>

          <Suspense fallback={<div className="header-search" aria-hidden />}>
            <HeaderSearch />
          </Suspense>

          <div className="header-actions">
            {user ? (
              <div className="header-account" ref={accountRef}>
                <button
                  type="button"
                  className="btn btn-ghost header-account__btn"
                  aria-haspopup="menu"
                  aria-expanded={accountOpen}
                  onClick={() => setAccountOpen((v) => !v)}
                >
                  <User size={17} />
                  <span className="header-account__name">{nameLabel}</span>
                  <ChevronDown
                    size={14}
                    className={`header-account__chev ${accountOpen ? "is-open" : ""}`}
                  />
                </button>

                {accountOpen && (
                  <div className="header-account__menu" role="menu">
                    <div className="header-account__meta">
                      <div className="header-account__meta-name">
                        {user.name?.trim() || nameLabel}
                      </div>
                      <div className="header-account__meta-email">{user.email}</div>
                    </div>
                    <Link
                      href="/profile"
                      className="header-account__item"
                      role="menuitem"
                      onClick={() => setAccountOpen(false)}
                    >
                      <UserRound size={15} />
                      Profil
                    </Link>
                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        className="header-account__item"
                        role="menuitem"
                        onClick={() => setAccountOpen(false)}
                      >
                        <LayoutDashboard size={15} />
                        Admin panel
                      </Link>
                    )}
                    <button
                      type="button"
                      className="header-account__item is-danger"
                      role="menuitem"
                      onClick={() => void onLogout()}
                    >
                      <LogOut size={15} />
                      Keluar
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-ghost header-account__btn"
                onClick={() => openAuth("login")}
              >
                <User size={17} />
                <span className="header-account__name">Masuk</span>
              </button>
            )}

            <button
              id="header-cart-btn"
              type="button"
              className="btn btn-dark relative"
              onClick={openCart}
            >
              <ShoppingBag size={16} />
              <span className="hidden sm:inline">Cart</span>
              {totalItems > 0 && <span className="cart-badge">{badge}</span>}
            </button>
          </div>
        </div>

        <Suspense fallback={<div className="header-search header-search--mobile" aria-hidden />}>
          <HeaderSearch mobile />
        </Suspense>

        <Suspense
          fallback={
            <div className="site-header__nav" aria-hidden>
              <div className="nav-mega" />
            </div>
          }
        >
          <HeaderNav />
        </Suspense>
      </div>

      {mobileMenu}
    </header>
  );
}
