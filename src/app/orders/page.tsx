"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  MapPin,
  MessageCircle,
  Package,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { PageLoading } from "@/components/PageLoading";
import { formatDate, formatIDR, orderStatusLabel } from "@/lib/format";
import {
  STORE,
  orderWhatsAppMessage,
  whatsappUrl,
  type PaymentMethod,
} from "@/lib/store";
import { useAuthStore } from "@/store/auth-store";

type OrderRow = {
  id: number;
  code: string;
  status: string;
  paymentMethod: PaymentMethod;
  paymentProof: string | null;
  total: number;
  shippingFee?: number;
  shippingService?: string | null;
  shippingEta?: string | null;
  shippingAddress: string;
  createdAt: string;
  items: {
    variantId: number;
    name: string;
    nic: string | null;
    qty: number;
    price: number;
    image: string;
  }[];
};

function statusTone(status: string) {
  switch (status) {
    case "pending_payment":
      return "is-warn";
    case "paid":
    case "processing":
      return "is-info";
    case "shipped":
      return "is-ship";
    case "completed":
      return "is-ok";
    case "cancelled":
      return "is-bad";
    default:
      return "";
  }
}

function paymentLabel(method: PaymentMethod) {
  return method === "whatsapp" ? "WhatsApp" : "Transfer bank";
}

function OrdersContent() {
  const user = useAuthStore((s) => s.user);
  const ready = useAuthStore((s) => s.ready);
  const router = useRouter();
  const search = useSearchParams();
  const highlight = search.get("highlight");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login?next=/orders");
      return;
    }
    void (async () => {
      const res = await fetch("/api/orders", { cache: "no-store" });
      const data = await res.json();
      if (data.ok) setOrders(data.orders);
      setLoading(false);
    })();
  }, [ready, user, router]);

  if (!ready || !user || loading) {
    return <PageLoading label="Menyiapkan pesanan" variant="orders" />;
  }

  const activeCount = orders.filter((o) => !["completed", "cancelled"].includes(o.status)).length;
  const highlighted = orders.find((o) => o.code === highlight);

  return (
    <div className="container-store orders-page">
      <nav className="orders-page__crumb" aria-label="Breadcrumb">
        <Link href="/">Beranda</Link>
        <span>/</span>
        <Link href="/profile">Profil</Link>
        <span>/</span>
        <span>Pesanan</span>
      </nav>

      <header className="orders-head">
        <div className="orders-head__top">
          <div>
            <p className="section-kicker">Riwayat belanja</p>
            <h1 className="display orders-head__title">Status pesanan</h1>
            <p className="orders-head__lead">
              Pantau order, lanjut transfer + bukti, atau konfirmasi via WhatsApp.
            </p>
          </div>
          <div className="orders-head__stats">
            <div className="orders-stat-chip">
              <strong>{orders.length}</strong>
              <span>Total</span>
            </div>
            <div className="orders-stat-chip">
              <strong>{activeCount}</strong>
              <span>Aktif</span>
            </div>
          </div>
        </div>
        <div className="orders-head__links">
          <Link href="/products" className="orders-head__link">
            <ShoppingBag size={15} />
            Belanja
          </Link>
          <Link href="/profile" className="orders-head__link">
            <UserRound size={15} />
            Profil
          </Link>
          <a
            href={whatsappUrl(`Halo ${STORE.name}, saya ingin tanya status pesanan.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="orders-head__link"
          >
            <MessageCircle size={15} />
            WhatsApp
          </a>
        </div>
      </header>

      {highlight && highlighted && (
        <div className="orders-notice" role="status">
          {highlighted.paymentMethod === "bank" ? (
            <>
              Pesanan <strong>{highlight}</strong> dibuat. Bukti transfer diterima — menunggu
              verifikasi toko.
            </>
          ) : (
            <>
              Pesanan <strong>{highlight}</strong> dibuat. Lanjutkan chat WhatsApp jika belum
              terbuka.
            </>
          )}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="orders-empty">
          <div className="orders-empty__icon" aria-hidden>
            <Package size={22} />
          </div>
          <h2 className="display">Belum ada pesanan</h2>
          <p>Setelah checkout, status dan detail order akan muncul di sini.</p>
          <div className="orders-empty__actions">
            <Link href="/products" className="btn btn-primary">
              Mulai belanja
            </Link>
            <Link href="/profile" className="btn btn-ghost">
              Ke profil
            </Link>
          </div>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const itemCount = order.items.reduce((sum, item) => sum + item.qty, 0);
            const isHighlight = highlight === order.code;
            const waText = orderWhatsAppMessage({
              code: order.code,
              total: order.total,
              paymentMethod: order.paymentMethod || "bank",
              shippingService: order.shippingService,
              shippingEta: order.shippingEta,
              shippingFee: order.shippingFee,
              items: order.items,
            });

            return (
              <article
                key={order.id}
                id={order.code}
                className={`order-card ${isHighlight ? "is-highlight" : ""}`}
              >
                <header className="order-card__head">
                  <div className="order-card__meta">
                    <div className="order-card__code-row">
                      <span className="order-card__mark" aria-hidden>
                        <Package size={14} />
                      </span>
                      <div className="order-card__code">{order.code}</div>
                    </div>
                    <time className="order-card__date" dateTime={order.createdAt}>
                      {formatDate(order.createdAt)}
                    </time>
                  </div>
                  <div className="order-card__tags">
                    <span className="order-pay-tag">
                      {order.paymentMethod === "whatsapp" ? (
                        <MessageCircle size={12} />
                      ) : (
                        <Building2 size={12} />
                      )}
                      {paymentLabel(order.paymentMethod || "bank")}
                    </span>
                    <span className={`order-status ${statusTone(order.status)}`}>
                      {orderStatusLabel(order.status)}
                    </span>
                  </div>
                </header>

                <div className="order-card__items">
                  {order.items.map((item) => (
                    <div key={`${order.id}-${item.variantId}`} className="order-item">
                      <div className="order-item__thumb">
                        <Image src={item.image} alt={item.name} fill className="object-contain p-1.5" />
                      </div>
                      <div className="order-item__body">
                        <div className="order-item__name">{item.name}</div>
                        <div className="order-item__sub">
                          {item.nic ? `NIC ${item.nic} · ` : ""}
                          Qty {item.qty}
                        </div>
                      </div>
                      <div className="order-item__price">{formatIDR(item.price * item.qty)}</div>
                    </div>
                  ))}
                </div>

                {order.status === "pending_payment" && (
                  <div className="order-paybox">
                    {order.paymentMethod === "bank" ? (
                      <>
                        <p>
                          Transfer ke <strong>{STORE.bank.accountNumber}</strong> a.n.{" "}
                          <strong>{STORE.bank.accountName}</strong>
                          {order.paymentProof ? " · Bukti sudah diunggah." : "."}
                        </p>
                        <div className="order-paybox__actions">
                          {order.paymentProof && (
                            <a
                              href={order.paymentProof}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-ghost"
                            >
                              Lihat bukti
                            </a>
                          )}
                          <a
                            href={whatsappUrl(waText)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                          >
                            Konfirmasi via WhatsApp
                          </a>
                        </div>
                      </>
                    ) : (
                      <>
                        <p>Selesaikan pembayaran dan detail pengiriman melalui WhatsApp toko.</p>
                        <div className="order-paybox__actions">
                          <a
                            href={whatsappUrl(waText)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                          >
                            Lanjut di WhatsApp
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <footer className="order-card__foot">
                  <div className="order-card__ship">
                    <span className="order-card__ship-label">
                      <MapPin size={12} />
                      Dikirim ke
                    </span>
                    <p>{order.shippingAddress}</p>
                    {(order.shippingService || order.shippingFee != null) && (
                      <p className="order-card__ship-meta">
                        Ongkir
                        {order.shippingService ? ` ${order.shippingService}` : ""}
                        {order.shippingFee != null ? ` · ${formatIDR(order.shippingFee)}` : ""}
                        {order.shippingEta ? ` · ${order.shippingEta}` : ""}
                      </p>
                    )}
                  </div>
                  <div className="order-card__total">
                    <span>
                      {itemCount} item · Total
                    </span>
                    <strong>{formatIDR(order.total)}</strong>
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<PageLoading label="Menyiapkan pesanan" variant="orders" />}>
      <OrdersContent />
    </Suspense>
  );
}
