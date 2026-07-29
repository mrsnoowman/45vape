"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, Search, ShoppingBag } from "lucide-react";
import { PageLoading } from "@/components/PageLoading";
import { formatDate, formatIDR, orderStatusLabel } from "@/lib/format";

const STATUS_FILTERS = [
  { value: "", label: "Semua" },
  { value: "pending_payment", label: "Menunggu bayar" },
  { value: "paid", label: "Dibayar" },
  { value: "processing", label: "Diproses" },
  { value: "shipped", label: "Dikirim" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Batal" },
];

type OrderRow = {
  id: number;
  code: string;
  status: string;
  paymentMethod: string;
  total: number;
  createdAt: string;
  itemCount: number;
  customer: { name: string; email: string };
};

function shortDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function AdminOrdersPage() {
  const search = useSearchParams();
  const [status, setStatus] = useState(search.get("status") || "");
  const [q, setQ] = useState("");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async (nextStatus = status, nextQ = q) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (nextStatus) params.set("status", nextStatus);
    if (nextQ.trim()) params.set("q", nextQ.trim());
    const res = await fetch(`/api/admin/orders?${params}`, { cache: "no-store" });
    const data = await res.json();
    if (data.ok) setOrders(data.orders);
    setLoading(false);
  };

  useEffect(() => {
    void load(search.get("status") || "", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(() => {
    const pending = orders.filter((o) => o.status === "pending_payment").length;
    const processing = orders.filter((o) =>
      ["paid", "processing", "shipped"].includes(o.status),
    ).length;
    const revenue = orders.reduce((sum, o) => sum + o.total, 0);
    return { pending, processing, revenue, total: orders.length };
  }, [orders]);

  return (
    <div className="admin-list-page">
      <div className="admin-page-bar">
        <p className="admin-page-bar__desc">
          Pantau order masuk dan update status pembayaran/pengiriman.
        </p>
      </div>

      {!loading && (
        <div className="admin-products__summary">
          <div className="admin-mini-stat">
            <em>Ditampilkan</em>
            <strong>{summary.total}</strong>
          </div>
          <div className="admin-mini-stat is-warn">
            <em>Menunggu bayar</em>
            <strong>{summary.pending}</strong>
          </div>
          <div className="admin-mini-stat">
            <em>Diproses</em>
            <strong>{summary.processing}</strong>
          </div>
          <div className="admin-mini-stat">
            <em>Nilai</em>
            <strong className="admin-mini-stat__price">{formatIDR(summary.revenue)}</strong>
          </div>
        </div>
      )}

      <div className="admin-filters">
        <form
          className="admin-search"
          onSubmit={(e) => {
            e.preventDefault();
            void load();
          }}
        >
          <Search size={15} strokeWidth={1.9} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari kode, nama, email, atau telepon…"
          />
        </form>
        <select
          className="admin-select"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            void load(e.target.value, q);
          }}
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s.value || "all"} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button type="button" className="admin-btn" onClick={() => void load()}>
          Cari
        </button>
      </div>

      {loading ? (
        <PageLoading label="Memuat pesanan" variant="orders" />
      ) : (
        <section className="admin-panel">
          <div className="admin-panel__head">
            <div>
              <h2>Daftar pesanan</h2>
              <p>
                {orders.length} pesanan
                {status
                  ? ` · ${STATUS_FILTERS.find((s) => s.value === status)?.label || status}`
                  : ""}
              </p>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="admin-empty">
              <ShoppingBag size={22} strokeWidth={1.7} />
              <strong>Belum ada pesanan</strong>
              <p>Pesanan baru akan muncul di sini setelah checkout.</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Kode</th>
                    <th>Customer</th>
                    <th>Bayar</th>
                    <th>Item</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Tanggal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <Link href={`/admin/orders/${o.id}`} className="admin-code">
                          {o.code}
                        </Link>
                      </td>
                      <td>
                        <div className="admin-stack-cell">
                          <strong>{o.customer.name || "—"}</strong>
                          <em>{o.customer.email}</em>
                        </div>
                      </td>
                      <td>
                        <span className="admin-cat">
                          {o.paymentMethod === "whatsapp" ? "WhatsApp" : "Transfer"}
                        </span>
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
                      <td>
                        <Link href={`/admin/orders/${o.id}`} className="admin-btn admin-btn--sm">
                          <Eye size={13} strokeWidth={1.9} />
                          Detail
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
