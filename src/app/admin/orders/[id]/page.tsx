"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  Package,
  Truck,
  UserRound,
  Wallet,
} from "lucide-react";
import { PageLoading } from "@/components/PageLoading";
import { formatDate, formatIDR, orderStatusLabel } from "@/lib/format";

const STATUSES = [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "completed",
  "cancelled",
] as const;

type OrderDetail = {
  id: number;
  code: string;
  status: string;
  paymentMethod: string;
  paymentProof: string | null;
  subtotal: number;
  shippingFee: number;
  shippingService?: string | null;
  shippingEta?: string | null;
  total: number;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  note: string | null;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  items: {
    id: number;
    name: string;
    nic: string | null;
    image: string;
    price: number;
    qty: number;
  }[];
};

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/admin/orders/${params.id}`, { cache: "no-store" });
      const data = await res.json();
      if (data.ok) {
        setOrder(data.order);
        setStatus(data.order.status);
      }
      setLoading(false);
    })();
  }, [params.id]);

  if (loading || !order) {
    return <PageLoading label="Memuat detail pesanan" variant="orders" />;
  }

  const saveStatus = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.ok) {
      setOrder(data.order);
      setMessage("Status pesanan diperbarui");
    } else {
      setError(data.message || "Gagal update status");
    }
  };

  const itemCount = order.items.reduce((sum, item) => sum + item.qty, 0);
  const paymentLabel = order.paymentMethod === "whatsapp" ? "WhatsApp" : "Transfer bank";

  return (
    <div className="admin-order-page">
      <div className="admin-page-bar">
        <Link href="/admin/orders" className="admin-back">
          <ArrowLeft size={14} strokeWidth={2} />
          Pesanan
        </Link>
        <div className="admin-page-bar__title">
          <span className="admin-order-page__code">{order.code}</span>
          <span className={`admin-badge status-${order.status}`}>
            {orderStatusLabel(order.status)}
          </span>
        </div>
        <p className="admin-page-bar__meta">{formatDate(order.createdAt)}</p>
      </div>

      <div className="admin-products__summary">
        <div className="admin-mini-stat">
          <em>Item</em>
          <strong>{itemCount}</strong>
        </div>
        <div className="admin-mini-stat">
          <em>Pembayaran</em>
          <strong className="admin-mini-stat__text">{paymentLabel}</strong>
        </div>
        <div className="admin-mini-stat">
          <em>Ongkir</em>
          <strong className="admin-mini-stat__price">{formatIDR(order.shippingFee)}</strong>
        </div>
        <div className="admin-mini-stat">
          <em>Total</em>
          <strong className="admin-mini-stat__price">{formatIDR(order.total)}</strong>
        </div>
      </div>

      <div className="admin-detail-grid">
        <section className="admin-panel">
          <div className="admin-panel__head">
            <div>
              <h2>Item pesanan</h2>
              <p>{order.items.length} produk dalam pesanan ini.</p>
            </div>
          </div>

          <div className="admin-order-items">
            {order.items.map((item) => (
              <div key={item.id} className="admin-order-item">
                <span className="admin-order-item__thumb">
                  <Image src={item.image} alt="" fill className="object-contain p-1" />
                </span>
                <div className="admin-order-item__meta">
                  <strong>{item.name}</strong>
                  <em>
                    {item.nic ? `NIC ${item.nic} · ` : ""}
                    Qty {item.qty} · {formatIDR(item.price)}
                  </em>
                </div>
                <span className="admin-order-item__total">
                  {formatIDR(item.price * item.qty)}
                </span>
              </div>
            ))}
          </div>

          <div className="admin-totals">
            <div>
              <span>Subtotal</span>
              <strong>{formatIDR(order.subtotal)}</strong>
            </div>
            <div>
              <span>
                Ongkir
                {order.shippingService ? ` · ${order.shippingService}` : ""}
              </span>
              <strong>{formatIDR(order.shippingFee)}</strong>
            </div>
            {order.shippingEta ? (
              <div>
                <span>Estimasi</span>
                <strong>{order.shippingEta}</strong>
              </div>
            ) : null}
            <div className="is-total">
              <span>Total bayar</span>
              <strong>{formatIDR(order.total)}</strong>
            </div>
          </div>
        </section>

        <div className="admin-detail-side">
          <section className="admin-panel">
            <div className="admin-panel__head">
              <div>
                <h2>Update status</h2>
                <p>Ubah status pembayaran atau pengiriman.</p>
              </div>
            </div>

            <label className="admin-fields admin-fields--stack">
              <span>Status pesanan</span>
              <select
                className="admin-input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {orderStatusLabel(s)}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="admin-btn admin-btn--primary admin-btn--block"
              disabled={saving || status === order.status}
              onClick={() => void saveStatus()}
            >
              {saving ? "Menyimpan…" : "Simpan status"}
            </button>

            {message ? <div className="admin-form__success">{message}</div> : null}
            {error ? <div className="admin-form__error">{error}</div> : null}
          </section>

          <section className="admin-panel">
            <div className="admin-panel__head">
              <div>
                <h2>Customer</h2>
                <p>Akun & kontak pemesan</p>
              </div>
            </div>

            <div className="admin-person-card">
              <span className="admin-person-card__avatar" aria-hidden>
                {(order.user.name || order.shippingName || "C").trim().charAt(0).toUpperCase()}
              </span>
              <div className="admin-person-card__meta">
                <strong>{order.user.name || order.shippingName}</strong>
                <em>{order.user.email}</em>
              </div>
            </div>

            <div className="admin-info-list">
              <div className="admin-info-row">
                <span className="admin-info-row__icon">
                  <UserRound size={14} strokeWidth={1.9} />
                </span>
                <div>
                  <em>Telepon akun</em>
                  <strong>{order.user.phone || "—"}</strong>
                </div>
              </div>
              <div className="admin-info-row">
                <span className="admin-info-row__icon">
                  <Wallet size={14} strokeWidth={1.9} />
                </span>
                <div>
                  <em>Metode bayar</em>
                  <strong>
                    <span className="admin-pay-pill">{paymentLabel}</span>
                  </strong>
                </div>
              </div>
            </div>

            {order.paymentProof ? (
              <a
                href={order.paymentProof}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-btn admin-btn--block"
              >
                <ExternalLink size={14} />
                Lihat bukti transfer
              </a>
            ) : (
              <p className="admin-proof-empty">Belum ada bukti transfer.</p>
            )}
          </section>

          <section className="admin-panel">
            <div className="admin-panel__head">
              <div>
                <h2>Pengiriman</h2>
                <p>Tujuan & layanan ongkir</p>
              </div>
            </div>

            <div className="admin-ship-card">
              <div className="admin-ship-card__head">
                <span className="admin-info-row__icon is-accent">
                  <MapPin size={14} strokeWidth={1.9} />
                </span>
                <div>
                  <em>Alamat tujuan</em>
                  <strong>{order.shippingAddress}</strong>
                </div>
              </div>

              <div className="admin-info-list admin-info-list--tight">
                <div className="admin-info-row">
                  <span className="admin-info-row__icon">
                    <Truck size={14} strokeWidth={1.9} />
                  </span>
                  <div>
                    <em>Penerima</em>
                    <strong>{order.shippingName}</strong>
                  </div>
                </div>
                <div className="admin-info-row">
                  <span className="admin-info-row__icon">
                    <UserRound size={14} strokeWidth={1.9} />
                  </span>
                  <div>
                    <em>Telepon</em>
                    <strong>{order.shippingPhone}</strong>
                  </div>
                </div>
                {order.shippingService ? (
                  <div className="admin-info-row">
                    <span className="admin-info-row__icon">
                      <Package size={14} strokeWidth={1.9} />
                    </span>
                    <div>
                      <em>Layanan</em>
                      <strong>
                        {order.shippingService}
                        {order.shippingEta ? (
                          <span className="admin-ship-eta">{order.shippingEta}</span>
                        ) : null}
                      </strong>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {order.note ? (
              <div className="admin-note-box">
                <em>Catatan pembeli</em>
                <p>{order.note}</p>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
