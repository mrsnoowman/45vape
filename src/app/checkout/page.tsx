"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Check,
  MessageCircle,
  ShoppingBag,
  Truck,
  Upload,
} from "lucide-react";
import { PageLoading } from "@/components/PageLoading";
import { WilayahSelects } from "@/components/WilayahSelects";
import { formatIDR } from "@/lib/format";
import {
  STORE,
  orderWhatsAppMessage,
  whatsappUrl,
  type PaymentMethod,
} from "@/lib/store";
import type { ShippingOption, ShippingQuote, ShippingService } from "@/lib/pricing";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";

type DestinationForm = {
  address: string;
  city: string;
  province: string;
  postalCode: string;
};

type CheckoutPreview = {
  shippingFee: number;
  shippingEta: string;
  shippingService: ShippingService;
  total: number;
  shipping: ShippingQuote;
  user: {
    name: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    profileComplete: boolean;
  };
};

function destinationReady(d: DestinationForm) {
  return (
    d.address.trim().length >= 5 &&
    d.city.trim().length >= 2 &&
    d.province.trim().length >= 2 &&
    d.postalCode.trim().length >= 3
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const authReady = useAuthStore((s) => s.ready);
  const refreshAuth = useAuthStore((s) => s.refresh);
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const cartReady = useCartStore((s) => s.ready);
  const refreshCart = useCartStore((s) => s.refresh);

  const [preview, setPreview] = useState<CheckoutPreview | null>(null);
  const [destination, setDestination] = useState<DestinationForm>({
    address: "",
    city: "",
    province: "",
    postalCode: "",
  });
  const [shipping, setShipping] = useState<ShippingQuote | null>(null);
  const [shippingService, setShippingService] = useState<ShippingService>("reg");
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [destHydrated, setDestHydrated] = useState(false);
  const [wilayahKey, setWilayahKey] = useState(0);

  const fetchQuote = useCallback(
    async (dest: DestinationForm, service: ShippingService = shippingService) => {
      if (!destinationReady(dest)) {
        setQuoteError("Isi alamat, kota, provinsi, dan kode pos untuk cek ongkir.");
        setShipping(null);
        return;
      }

      setQuoting(true);
      setQuoteError("");
      const params = new URLSearchParams({
        address: dest.address.trim(),
        city: dest.city.trim(),
        province: dest.province.trim(),
        postalCode: dest.postalCode.trim(),
        service,
      });
      const res = await fetch(`/api/checkout?${params.toString()}`, { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/login?next=/checkout");
        return;
      }
      const data = await res.json();
      setQuoting(false);
      if (!data.ok) {
        setQuoteError(data.message || "Gagal cek ongkir");
        return;
      }
      setPreview(data);
      setShipping(data.shipping);
      setShippingService(data.shippingService || service);
    },
    [router, shippingService]
  );

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      router.replace("/login?next=/checkout");
      return;
    }
    void (async () => {
      const res = await fetch("/api/checkout", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/login?next=/checkout");
        return;
      }
      const data = await res.json();
      if (!data.ok) return;
      setPreview(data);
      setShipping(data.shipping);
      setShippingService(data.shippingService || data.shipping?.defaultService || "reg");
      if (!destHydrated) {
        setDestination({
          address: data.user.address || user.address || "",
          city: data.user.city || user.city || "",
          province: data.user.province || user.province || "",
          postalCode: data.user.postalCode || user.postalCode || "",
        });
        setDestHydrated(true);
      }
    })();
  }, [authReady, user, router, destHydrated]);

  useEffect(() => {
    if (!proofFile || !proofFile.type.startsWith("image/")) {
      setProofPreview(null);
      return;
    }
    const url = URL.createObjectURL(proofFile);
    setProofPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [proofFile]);

  const proofLabel = useMemo(() => {
    if (!proofFile) return "";
    const mb = (proofFile.size / (1024 * 1024)).toFixed(1);
    const kind = proofFile.type.includes("pdf") ? "PDF" : "Gambar";
    return `${kind} · ${mb} MB`;
  }, [proofFile]);

  const selectedOption: ShippingOption | null = useMemo(() => {
    if (!shipping?.options) return null;
    return shipping.options.find((o) => o.code === shippingService) ?? shipping.options[0] ?? null;
  }, [shipping, shippingService]);

  if (!authReady || !cartReady || !user) {
    return <PageLoading label="Menyiapkan checkout" variant="cart" />;
  }

  if (items.length === 0) {
    return (
      <div className="container-store page-shell">
        <div className="checkout-empty">
          <div className="checkout-empty__icon" aria-hidden>
            <ShoppingBag size={22} />
          </div>
          <h1 className="display">Keranjang kosong</h1>
          <p>Tambahkan produk dulu sebelum checkout.</p>
          <Link href="/products" className="btn btn-primary mt-5">
            Belanja dulu
          </Link>
        </div>
      </div>
    );
  }

  const complete = preview?.user.profileComplete ?? Boolean(user.profileComplete);
  const destOk = destinationReady(destination);
  const fee = selectedOption?.fee ?? preview?.shippingFee ?? 0;
  const eta = selectedOption?.eta ?? preview?.shippingEta ?? "—";
  const total = subtotal + fee;
  const canSubmit =
    complete &&
    destOk &&
    Boolean(shipping) &&
    !submitting &&
    (paymentMethod === "whatsapp" || Boolean(proofFile));

  const onDestChange = (field: keyof DestinationForm, value: string) => {
    setDestination((prev) => ({ ...prev, [field]: value }));
    setShipping(null);
    setQuoteError("");
  };

  const onWilayahChange = (
    next: { province: string; city: string; postalCode: string },
    meta: { source: "hydrate" | "user" }
  ) => {
    setDestination((prev) => ({ ...prev, ...next }));
    if (meta.source === "user") {
      setShipping(null);
      setQuoteError("");
    }
  };

  const onProofChange = (file: File | null) => {
    setError("");
    if (!file) {
      setProofFile(null);
      return;
    }
    const okType =
      file.type === "image/jpeg" ||
      file.type === "image/png" ||
      file.type === "image/webp" ||
      file.type === "application/pdf";
    if (!okType) {
      setError("Bukti harus JPG, PNG, WEBP, atau PDF");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran bukti maksimal 5 MB");
      return;
    }
    setProofFile(file);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!complete) {
      setError("Lengkapi profil pengiriman terlebih dahulu");
      return;
    }
    if (!destOk) {
      setError("Lengkapi lokasi pengiriman untuk cek ongkir");
      return;
    }
    if (!shipping) {
      setError("Cek ongkir dulu sebelum membuat pesanan");
      return;
    }
    if (paymentMethod === "bank" && !proofFile) {
      setError("Unggah bukti transfer sebelum membuat pesanan");
      return;
    }

    setSubmitting(true);
    const form = new FormData();
    form.set("paymentMethod", paymentMethod);
    form.set("shippingService", shippingService);
    form.set("address", destination.address.trim());
    form.set("city", destination.city.trim());
    form.set("province", destination.province.trim());
    form.set("postalCode", destination.postalCode.trim());
    form.set("note", note);
    if (paymentMethod === "bank" && proofFile) {
      form.set("paymentProof", proofFile);
    }

    const res = await fetch("/api/checkout", { method: "POST", body: form });
    const data = await res.json();
    setSubmitting(false);

    if (!data.ok) {
      if (data.code === "PROFILE_INCOMPLETE") {
        router.push("/profile?next=/checkout");
        return;
      }
      setError(data.message || "Checkout gagal");
      return;
    }

    await refreshCart();
    await refreshAuth();

    if (paymentMethod === "whatsapp" && data.order) {
      const text = orderWhatsAppMessage({
        code: data.order.code,
        total: data.order.total,
        paymentMethod: "whatsapp",
        shippingService: data.order.shippingService,
        shippingEta: data.order.shippingEta,
        shippingFee: data.order.shippingFee,
        items: data.order.items || items.map((i) => ({ name: i.name, nic: i.nic, qty: i.qty })),
      });
      window.open(whatsappUrl(text), "_blank", "noopener,noreferrer");
    }

    router.push(`/orders?highlight=${data.order.code}`);
  };

  return (
    <div className="container-store checkout-page">
      <header className="checkout-head">
        <div className="checkout-head__panel">
          <div className="checkout-head__copy">
            <p className="checkout-head__brand">45 Vape</p>
            <h1 className="display checkout-head__title">Checkout</h1>
            <p className="checkout-head__lead">
              Lengkapi pengiriman & pembayaran — transfer bukti, atau lanjut via WhatsApp.
            </p>
          </div>

          <ol className="checkout-steps" aria-label="Langkah checkout">
            <li className="checkout-steps__item is-done">
              <span className="checkout-steps__dot" aria-hidden>
                <Check size={14} strokeWidth={2.5} />
              </span>
              <span className="checkout-steps__label">Keranjang</span>
            </li>
            <li className="checkout-steps__item is-active" aria-current="step">
              <span className="checkout-steps__dot" aria-hidden>
                2
              </span>
              <span className="checkout-steps__label">Checkout</span>
            </li>
            <li className="checkout-steps__item">
              <span className="checkout-steps__dot" aria-hidden>
                3
              </span>
              <span className="checkout-steps__label">Pesanan</span>
            </li>
          </ol>
        </div>
      </header>

      <form onSubmit={onSubmit} className="checkout-grid">
        <div className="checkout-main">
          <section className="checkout-block">
            <div className="checkout-block__head">
              <div className="checkout-block__index" aria-hidden>
                01
              </div>
              <div className="checkout-block__titles">
                <h2 className="display">Pengiriman</h2>
                <p>Alamat tujuan & estimasi ongkir untuk pesanan ini.</p>
              </div>
              <div className="checkout-block__actions">
                <button
                  type="button"
                  className="btn btn-ghost checkout-block__action"
                  onClick={() => {
                    const next = {
                      address: user.address || "",
                      city: user.city || "",
                      province: user.province || "",
                      postalCode: user.postalCode || "",
                    };
                    setDestination(next);
                    setQuoteError("");
                    setWilayahKey((k) => k + 1);
                    void fetchQuote(next);
                  }}
                >
                  Pakai profil
                </button>
                <Link href="/profile?next=/checkout" className="btn btn-ghost checkout-block__action">
                  {complete ? "Edit profil" : "Lengkapi"}
                </Link>
              </div>
            </div>

            {!complete && (
              <div className="checkout-warn">
                Profil belum lengkap. Isi data dasar di profil, lalu sesuaikan lokasi di sini jika
                perlu.
              </div>
            )}

            <div className="ship-dest">
              <div className="ship-dest__identity">
                <span className="ship-dest__avatar" aria-hidden>
                  {(user.name || "M").trim().charAt(0).toUpperCase()}
                </span>
                <div>
                  <strong>{user.name}</strong>
                  <span>{user.phone}</span>
                </div>
              </div>

              <div className="ship-dest__fields">
                <label className="label" htmlFor="ship-address">
                  Alamat lengkap
                </label>
                <textarea
                  id="ship-address"
                  className="input"
                  rows={2}
                  value={destination.address}
                  onChange={(e) => onDestChange("address", e.target.value)}
                  placeholder="Nama jalan, nomor, RT/RW, patokan..."
                />
                <WilayahSelects
                  key={wilayahKey}
                  idPrefix="ship"
                  province={destination.province}
                  city={destination.city}
                  postalCode={destination.postalCode}
                  onChange={onWilayahChange}
                />
              </div>

              <div className="ship-panel">
                <div className="ship-panel__bar">
                  <div>
                    <strong>Cek ongkir</strong>
                    <span>Hitung estimasi dari lokasi di atas</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary ship-check-btn"
                    disabled={quoting || !destOk}
                    onClick={() => void fetchQuote(destination)}
                  >
                    <Truck size={16} aria-hidden />
                    {quoting ? "Mengecek..." : "Cek ongkir"}
                  </button>
                </div>

                {quoteError && <p className="ship-quote__error">{quoteError}</p>}

                {shipping ? (
                  <>
                    <div className="ship-quote">
                      <div className="ship-quote__row">
                        <span>Tujuan</span>
                        <strong>
                          {shipping.destination.city}, {shipping.destination.province}{" "}
                          {shipping.destination.postalCode}
                        </strong>
                      </div>
                      <div className="ship-quote__row">
                        <span>Zona</span>
                        <strong>{shipping.zoneLabel}</strong>
                      </div>
                    </div>

                    <div className="ship-options" role="radiogroup" aria-label="Layanan pengiriman">
                      {shipping.options.map((opt) => (
                        <label
                          key={opt.code}
                          className={`ship-option ${shippingService === opt.code ? "is-active" : ""}`}
                        >
                          <input
                            type="radio"
                            name="shippingService"
                            value={opt.code}
                            checked={shippingService === opt.code}
                            onChange={() => setShippingService(opt.code)}
                          />
                          <span className="ship-option__body">
                            <strong>{opt.label}</strong>
                            <span>Estimasi {opt.eta}</span>
                          </span>
                          <span className="ship-option__fee">{formatIDR(opt.fee)}</span>
                        </label>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="ship-quote__note">
                    Pilih lokasi, lalu tekan <strong>Cek ongkir</strong> untuk melihat tarif.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="checkout-block">
            <div className="checkout-block__head">
              <div className="checkout-block__index" aria-hidden>
                02
              </div>
              <div className="checkout-block__titles">
                <h2 className="display">Item pesanan</h2>
                <p>
                  {items.length} jenis · {items.reduce((n, i) => n + i.qty, 0)} pcs
                </p>
              </div>
            </div>
            <div className="checkout-items">
              {items.map((item) => (
                <div key={item.variantId} className="checkout-item">
                  <div className="checkout-item__thumb">
                    <Image src={item.image} alt={item.name} fill className="object-contain p-1.5" />
                  </div>
                  <div className="checkout-item__body">
                    <div className="checkout-item__name">{item.name}</div>
                    <div className="checkout-item__meta">
                      {item.nic ? `NIC ${item.nic} · ` : ""}
                      Qty {item.qty}
                    </div>
                  </div>
                  <div className="checkout-item__price">{formatIDR(item.lineTotal)}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="checkout-block">
            <div className="checkout-block__head">
              <div className="checkout-block__index" aria-hidden>
                03
              </div>
              <div className="checkout-block__titles">
                <h2 className="display">Pembayaran</h2>
                <p>Transfer bank atau konfirmasi via WhatsApp.</p>
              </div>
            </div>

            <div className="pay-options" role="radiogroup" aria-label="Metode pembayaran">
              <label className={`pay-option ${paymentMethod === "bank" ? "is-active" : ""}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank"
                  checked={paymentMethod === "bank"}
                  onChange={() => {
                    setPaymentMethod("bank");
                    setError("");
                  }}
                />
                <span className="pay-option__icon" aria-hidden>
                  <Building2 size={18} />
                </span>
                <span className="pay-option__body">
                  <strong>Transfer bank</strong>
                  <span>Transfer ke rekening toko, lalu unggah bukti.</span>
                </span>
              </label>

              <label className={`pay-option ${paymentMethod === "whatsapp" ? "is-active" : ""}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="whatsapp"
                  checked={paymentMethod === "whatsapp"}
                  onChange={() => {
                    setPaymentMethod("whatsapp");
                    setError("");
                  }}
                />
                <span className="pay-option__icon is-wa" aria-hidden>
                  <MessageCircle size={18} />
                </span>
                <span className="pay-option__body">
                  <strong>Order via WhatsApp</strong>
                  <span>Lanjut chat ke {STORE.phoneDisplay}.</span>
                </span>
              </label>
            </div>

            {paymentMethod === "bank" ? (
              <div className="pay-bank">
                <div className="pay-bank__alert">
                  Transfer sesuai <strong>total bayar</strong>, lalu unggah bukti. Tanpa bukti, order
                  tidak diproses.
                </div>
                <div className="pay-bank__info">
                  <h3>Rekening tujuan</h3>
                  <ul>
                    <li>
                      <span>Bank</span>
                      <strong>{STORE.bank.banks}</strong>
                    </li>
                    <li>
                      <span>No. rekening</span>
                      <strong>{STORE.bank.accountNumber}</strong>
                    </li>
                    <li>
                      <span>Atas nama</span>
                      <strong>{STORE.bank.accountName}</strong>
                    </li>
                  </ul>
                </div>
                <div className="pay-proof">
                  <div className="pay-proof__label">
                    Bukti pembayaran <span aria-hidden>*</span>
                  </div>
                  <input
                    id="payment-proof"
                    className="pay-proof__input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(e) => onProofChange(e.target.files?.[0] ?? null)}
                  />
                  {!proofFile ? (
                    <label htmlFor="payment-proof" className="pay-proof__drop">
                      <span className="pay-proof__drop-icon" aria-hidden>
                        <Upload size={18} />
                      </span>
                      <span className="pay-proof__drop-copy">
                        <strong>Unggah bukti transfer</strong>
                        <span>JPG, PNG, WEBP, atau PDF · maks. 5 MB</span>
                      </span>
                    </label>
                  ) : (
                    <div className="pay-proof__card">
                      {proofPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={proofPreview} alt="Preview bukti" className="pay-proof__thumb" />
                      ) : (
                        <span className="pay-proof__pdf">PDF</span>
                      )}
                      <div className="pay-proof__meta">
                        <strong title={proofFile.name}>{proofFile.name}</strong>
                        <span>{proofLabel}</span>
                      </div>
                      <div className="pay-proof__actions">
                        <label htmlFor="payment-proof" className="pay-proof__btn">
                          Ganti
                        </label>
                        <button
                          type="button"
                          className="pay-proof__btn is-danger"
                          onClick={() => onProofChange(null)}
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="pay-wa">
                Setelah buat pesanan, chat WhatsApp terbuka dengan ringkasan order. Tim kami bantu
                proses pembayaran & pengiriman.
              </div>
            )}

            <div className="checkout-note-wrap">
              <label className="label" htmlFor="note">
                Catatan (opsional)
              </label>
              <textarea
                id="note"
                className="input checkout-note"
                placeholder="Contoh: kirim siang hari, bubble wrap ekstra..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </section>
        </div>

        <aside className="checkout-summary">
          <div className="checkout-summary__top">
            <p>Total bayar</p>
            <h2 className="display">{formatIDR(total)}</h2>
            <span className="checkout-summary__badge">
              {shipping
                ? `${selectedOption?.label || "Ongkir"} · ${eta}`
                : "Belum cek ongkir"}
            </span>
          </div>
          <div className="checkout-summary__rows">
            <div>
              <span>Subtotal</span>
              <strong>{formatIDR(subtotal)}</strong>
            </div>
            <div>
              <span>
                Ongkir
                {selectedOption ? ` · ${selectedOption.label}` : ""}
              </span>
              <strong>{shipping ? formatIDR(fee) : "—"}</strong>
            </div>
            <div>
              <span>Metode</span>
              <strong>{paymentMethod === "bank" ? "Transfer" : "WhatsApp"}</strong>
            </div>
          </div>
          <p className="checkout-summary__hint">
            {!shipping
              ? "Cek ongkir dulu agar total bayar akurat."
              : paymentMethod === "bank"
                ? "Status awal: menunggu verifikasi bukti transfer."
                : "Status awal: menunggu konfirmasi via WhatsApp."}
          </p>
          {error && <p className="checkout-summary__error">{error}</p>}
          <button type="submit" className="btn btn-primary w-full" disabled={!canSubmit}>
            {submitting
              ? "Memproses..."
              : paymentMethod === "bank"
                ? "Buat pesanan + Kirim Bukti"
                : "Buat pesanan + Buka WhatsApp"}
          </button>
          <Link href="/cart" className="btn btn-ghost w-full">
            Kembali ke keranjang
          </Link>
        </aside>
      </form>
    </div>
  );
}
