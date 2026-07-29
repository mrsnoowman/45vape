"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Clock3,
  Package,
  Plus,
  ShoppingBag,
  Users,
  Wallet,
} from "lucide-react";
import { PageLoading } from "@/components/PageLoading";
import { formatDate, formatIDR, orderStatusLabel } from "@/lib/format";

type Stats = {
  products: number;
  members: number;
  orders: number;
  revenue: number;
  pending: number;
  lowStock: number;
};

type Recent = {
  id: number;
  code: string;
  status: string;
  total: number;
  createdAt: string;
  customer: string;
  itemCount: number;
};

function shortDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Recent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      const data = await res.json();
      if (data.ok) {
        setStats(data.stats);
        setRecent(data.recentOrders || []);
      }
      setLoading(false);
    })();
  }, []);

  if (loading || !stats) {
    return <PageLoading label="Memuat dashboard" variant="orders" />;
  }

  const metrics = [
    { label: "Pesanan", value: String(stats.orders), icon: ShoppingBag, href: "/admin/orders" },
    { label: "Produk", value: String(stats.products), icon: Package, href: "/admin/products" },
    { label: "Member", value: String(stats.members), icon: Users, href: "/admin/members" },
    {
      label: "Menunggu bayar",
      value: String(stats.pending),
      icon: Clock3,
      href: "/admin/orders?status=pending_payment",
      tone: "is-warn" as const,
    },
    {
      label: "Stok menipis",
      value: String(stats.lowStock),
      icon: AlertTriangle,
      href: "/admin/products",
      tone: "is-warn" as const,
    },
  ];

  return (
    <div className="admin-dash">
      <div className="admin-page-bar">
        <p className="admin-page-bar__desc">
          Pantau penjualan, stok, dan pesanan masuk.
        </p>
        <div className="admin-page-bar__actions">
          <Link href="/admin/products/new" className="admin-btn admin-btn--primary">
            <Plus size={15} strokeWidth={2} />
            Tambah produk
          </Link>
          <Link href="/admin/orders" className="admin-btn">
            Kelola pesanan
            <ArrowRight size={14} strokeWidth={2} />
          </Link>
        </div>
      </div>

      {(stats.pending > 0 || stats.lowStock > 0) && (
        <div className="admin-dash__alerts">
          {stats.pending > 0 && (
            <Link href="/admin/orders?status=pending_payment" className="admin-alert is-warn">
              <Clock3 size={15} />
              <span>
                <strong>{stats.pending} pesanan</strong> menunggu pembayaran
              </span>
              <ArrowUpRight size={14} />
            </Link>
          )}
          {stats.lowStock > 0 && (
            <Link href="/admin/products" className="admin-alert is-stock">
              <AlertTriangle size={15} />
              <span>
                <strong>{stats.lowStock} produk</strong> stok menipis
              </span>
              <ArrowUpRight size={14} />
            </Link>
          )}
        </div>
      )}

      <div className="admin-dash__metrics">
        <Link href="/admin/orders" className="admin-metric-hero">
          <div className="admin-metric-hero__top">
            <span className="admin-metric-hero__icon">
              <Wallet size={18} strokeWidth={1.9} />
            </span>
            <span className="admin-metric-hero__tag">Pendapatan</span>
          </div>
          <strong className="admin-metric-hero__value">{formatIDR(stats.revenue)}</strong>
          <em className="admin-metric-hero__hint">Total dari seluruh pesanan tercatat</em>
        </Link>

        <div className="admin-dash__metric-grid">
          {metrics.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`admin-metric ${item.tone || ""}`}
              >
                <span className="admin-metric__icon">
                  <Icon size={15} strokeWidth={1.9} />
                </span>
                <span className="admin-metric__label">{item.label}</span>
                <strong className="admin-metric__value">{item.value}</strong>
              </Link>
            );
          })}
        </div>
      </div>

      <section className="admin-panel">
        <div className="admin-panel__head">
          <div>
            <h2>Pesanan terbaru</h2>
            <p>Aktivitas checkout terakhir di toko.</p>
          </div>
          <Link href="/admin/orders" className="admin-panel__link">
            Lihat semua
            <ArrowRight size={14} />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="admin-empty">
            <ShoppingBag size={22} strokeWidth={1.7} />
            <strong>Belum ada pesanan</strong>
            <p>Pesanan baru akan muncul di sini secara otomatis.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Customer</th>
                  <th>Item</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/admin/orders/${o.id}`} className="admin-code">
                        {o.code}
                      </Link>
                    </td>
                    <td>
                      <span className="admin-cell-strong">{o.customer}</span>
                    </td>
                    <td>{o.itemCount}</td>
                    <td>
                      <span className="admin-cell-strong">{formatIDR(o.total)}</span>
                    </td>
                    <td>
                      <span className={`admin-badge status-${o.status}`}>
                        {orderStatusLabel(o.status)}
                      </span>
                    </td>
                    <td>
                      <span className="admin-cell-muted" title={formatDate(o.createdAt)}>
                        {shortDate(o.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
