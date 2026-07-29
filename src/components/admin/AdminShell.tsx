"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BadgePercent,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PanelLeft,
  PanelLeftClose,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";
import { PageLoading } from "@/components/PageLoading";
import { useAuthStore } from "@/store/auth-store";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Produk", icon: Package },
  { href: "/admin/discounts", label: "Diskon", icon: BadgePercent },
  { href: "/admin/orders", label: "Pesanan", icon: ShoppingBag },
  { href: "/admin/members", label: "Member", icon: Users },
];

const COLLAPSE_KEY = "admin-sidebar-collapsed";

function pageTitle(pathname: string) {
  if (pathname.startsWith("/admin/products/new")) return "Tambah produk";
  if (pathname.startsWith("/admin/products/")) return "Edit produk";
  if (pathname.startsWith("/admin/products")) return "Produk";
  if (pathname.startsWith("/admin/discounts")) return "Diskon";
  if (pathname.startsWith("/admin/orders/")) return "Detail pesanan";
  if (pathname.startsWith("/admin/orders")) return "Pesanan";
  if (pathname.startsWith("/admin/members")) return "Member";
  return "Dashboard";
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const ready = useAuthStore((s) => s.ready);
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const title = useMemo(() => pageTitle(pathname), [pathname]);
  const displayName = user?.name?.trim() || "Admin";
  const initial = (displayName[0] || user?.email?.[0] || "A").toUpperCase();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (user.role !== "admin") {
      router.replace("/");
    }
  }, [ready, user, router, pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 960px)");
    const sync = () => {
      setIsDesktop(mq.matches);
      if (mq.matches) setMenuOpen(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const toggleSidebar = () => {
    if (isDesktop) {
      setCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
        } catch {
          /* ignore */
        }
        return next;
      });
      return;
    }
    setMenuOpen((open) => !open);
  };

  if (!ready || !user || user.role !== "admin") {
    return <PageLoading label="Menyiapkan admin" variant="orders" />;
  }

  const sidebarExpanded = isDesktop ? !collapsed : menuOpen;

  return (
    <div
      className={`admin-shell ${menuOpen ? "is-menu-open" : ""} ${
        collapsed ? "is-collapsed" : ""
      }`}
    >
      <button
        type="button"
        className={`admin-sidebar__backdrop ${menuOpen ? "is-visible" : ""}`}
        aria-label="Tutup menu"
        tabIndex={menuOpen ? 0 : -1}
        onClick={() => setMenuOpen(false)}
      />

      <aside
        className={`admin-sidebar ${menuOpen ? "is-open" : ""}`}
        id="admin-sidebar"
      >
        <div className="admin-sidebar__brand">
          <div className="admin-sidebar__brand-card">
            <div className="admin-sidebar__logo-wrap">
              <Image
                src="/brand/IMG_3820.PNG"
                alt="45 Vape"
                width={36}
                height={36}
                className="admin-sidebar__logo"
              />
            </div>
            <div className="admin-sidebar__brand-text">
              <strong>45 Vape</strong>
              <span>Control Center</span>
            </div>
            <span className="admin-sidebar__live">
              <i />
              Live
            </span>
          </div>
          <button
            type="button"
            className="admin-sidebar__close"
            aria-label="Tutup menu"
            onClick={() => setMenuOpen(false)}
          >
            <X size={16} />
          </button>
        </div>

        <div className="admin-sidebar__section">
          <p className="admin-sidebar__label">Manajemen</p>
          <nav className="admin-sidebar__nav" aria-label="Admin">
            {NAV.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`admin-nav-link ${active ? "is-active" : ""}`}
                  title={item.label}
                >
                  <span className="admin-nav-link__icon-wrap">
                    <Icon size={15} strokeWidth={1.9} />
                  </span>
                  <span className="admin-nav-link__text">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="admin-sidebar__foot">
          <p className="admin-sidebar__label">Akses cepat</p>
          <Link
            href="/"
            className="admin-sidebar__store"
            target="_blank"
            rel="noopener noreferrer"
            title="Buka etalase toko"
          >
            <ExternalLink size={14} strokeWidth={1.85} />
            <span className="admin-sidebar__store-text">Buka etalase toko</span>
          </Link>

          <div className="admin-sidebar__user">
            <span className="admin-sidebar__avatar" aria-hidden>
              {initial}
            </span>
            <div className="admin-sidebar__user-meta">
              <strong>{displayName}</strong>
              <em>{user.email}</em>
            </div>
            <button
              type="button"
              className="admin-sidebar__logout"
              aria-label="Keluar"
              title="Keluar"
              onClick={async () => {
                await logout();
                router.replace("/login");
              }}
            >
              <LogOut size={14} strokeWidth={1.85} />
            </button>
          </div>
        </div>
      </aside>

      <div className="admin-content">
        <header className="admin-topbar">
          <div className="admin-topbar__left">
            <button
              type="button"
              className={`admin-topbar__menu ${
                sidebarExpanded ? "is-active" : ""
              }`}
              onClick={toggleSidebar}
              aria-label={
                isDesktop
                  ? collapsed
                    ? "Tampilkan sidebar"
                    : "Sembunyikan sidebar"
                  : menuOpen
                    ? "Tutup menu"
                    : "Buka menu"
              }
              aria-expanded={sidebarExpanded}
              aria-controls="admin-sidebar"
              title={
                isDesktop
                  ? collapsed
                    ? "Tampilkan sidebar"
                    : "Sembunyikan sidebar"
                  : "Menu"
              }
            >
              {isDesktop ? (
                collapsed ? (
                  <PanelLeft size={17} />
                ) : (
                  <PanelLeftClose size={17} />
                )
              ) : menuOpen ? (
                <X size={17} />
              ) : (
                <Menu size={17} />
              )}
            </button>
            <h1 className="admin-topbar__title">{title}</h1>
          </div>

          <div className="admin-topbar__right">
            <Link
              href="/"
              className="admin-topbar__action"
              target="_blank"
              rel="noopener noreferrer"
              title="Buka toko"
            >
              <ExternalLink size={14} strokeWidth={1.85} />
              <span>Toko</span>
            </Link>
            <div className="admin-topbar__divider" aria-hidden />
            <div className="admin-topbar__profile">
              <div className="admin-topbar__meta">
                <span>{displayName}</span>
                <em>Administrator</em>
              </div>
              <span className="admin-topbar__avatar" aria-hidden>
                {initial}
              </span>
            </div>
          </div>
        </header>
        <div className="admin-page">{children}</div>
      </div>
    </div>
  );
}
