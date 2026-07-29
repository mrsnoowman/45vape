"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  LogOut,
  MapPin,
  Package,
  ShoppingBag,
  Store,
  UserRound,
} from "lucide-react";
import { PageLoading } from "@/components/PageLoading";
import { WilayahSelects } from "@/components/WilayahSelects";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";

function initialsFrom(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  if (parts.length === 1 && parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

function ProfileForm() {
  const user = useAuthStore((s) => s.user);
  const ready = useAuthStore((s) => s.ready);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const logout = useAuthStore((s) => s.logout);
  const refreshCart = useCartStore((s) => s.refresh);
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [wilayahKey, setWilayahKey] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login?next=/profile");
      return;
    }
    setName(user.name || "");
    setPhone(user.phone || "");
    setAddress(user.address || "");
    setCity(user.city || "");
    setProvince(user.province || "");
    setPostalCode(user.postalCode || "");
    setWilayahKey((k) => k + 1);
  }, [user, ready, router]);

  const initials = useMemo(
    () => (user ? initialsFrom(user.name || "", user.email) : ""),
    [user]
  );

  if (!ready || !user) {
    return <PageLoading label="Menyiapkan profil" variant="profile" />;
  }

  const pct = user.profileCompletion ?? 0;
  const complete = pct >= 100;
  const checks = [
    { label: "Nama lengkap", done: Boolean(user.name?.trim()) },
    { label: "Nomor HP", done: Boolean(user.phone?.trim()) },
    {
      label: "Alamat pengiriman",
      done: Boolean(
        user.address?.trim() &&
          user.city?.trim() &&
          user.province?.trim() &&
          user.postalCode?.trim()
      ),
    },
  ];
  const ring = 2 * Math.PI * 34;
  const ringOffset = ring - (pct / 100) * ring;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const res = await updateProfile({ name, phone, address, city, province, postalCode });
    setSaving(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setMessage(res.message);
    if (next) router.push(next);
  };

  return (
    <div className="container-store profile-page">
      <nav className="profile-page__crumb" aria-label="Breadcrumb">
        <Link href="/">Beranda</Link>
        <span>/</span>
        <span>Profil</span>
      </nav>

      <section className="profile-cover">
        <div className="profile-cover__glow" aria-hidden />
        <div className="profile-cover__main">
          <div className="profile-cover__identity">
            <div className="profile-cover__avatar" aria-hidden>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="profile-cover__kicker">Member 45 Vape</p>
              <h1 className="display profile-cover__name">
                {user.name || "Lengkapi nama Anda"}
              </h1>
              <p className="profile-cover__email">{user.email}</p>
            </div>
          </div>

          <div className="profile-cover__ring-wrap" aria-label={`Kelengkapan profil ${pct}%`}>
            <div className="profile-cover__ring">
              <svg viewBox="0 0 80 80" aria-hidden>
                <circle className="profile-cover__ring-bg" cx="40" cy="40" r="34" />
                <circle
                  className="profile-cover__ring-fg"
                  cx="40"
                  cy="40"
                  r="34"
                  style={{
                    strokeDasharray: ring,
                    strokeDashoffset: ringOffset,
                  }}
                />
              </svg>
              <div className="profile-cover__ring-text">
                <strong>{pct}%</strong>
                <span>lengkap</span>
              </div>
            </div>
            <div className={`profile-cover__badge ${complete ? "is-complete" : "is-pending"}`}>
              {complete ? "Siap checkout" : "Lengkapi data"}
            </div>
          </div>
        </div>

        <div className="profile-cover__nav">
          <Link href="/orders" className="profile-cover__nav-item">
            <Package size={16} />
            Pesanan
          </Link>
          <Link href="/cart" className="profile-cover__nav-item">
            <ShoppingBag size={16} />
            Keranjang
          </Link>
          <Link href="/products" className="profile-cover__nav-item">
            <Store size={16} />
            Belanja
          </Link>
          <button
            type="button"
            className="profile-cover__nav-item is-muted"
            onClick={async () => {
              await logout();
              await refreshCart();
              router.push("/");
            }}
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </section>

      {next === "/checkout" && !complete && (
        <div className="profile-notice" role="status">
          Lengkapi data pengiriman di bawah ini untuk melanjutkan checkout.
        </div>
      )}

      <div className="profile-layout">
        <form onSubmit={onSubmit} className="profile-sheet">
          <header className="profile-sheet__head">
            <div>
              <p className="section-kicker">Pengiriman</p>
              <h2 className="display">Data alamat</h2>
            </div>
            <p>Dipakai otomatis saat checkout.</p>
          </header>

          <div className="profile-section">
            <div className="profile-section__label">
              <UserRound size={15} />
              Kontak
            </div>
            <div className="profile-grid">
              <div className="profile-field profile-field--wide">
                <label className="label" htmlFor="name">
                  Nama lengkap
                </label>
                <input
                  id="name"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama penerima"
                  required
                />
              </div>
              <div className="profile-field">
                <label className="label" htmlFor="phone">
                  No. HP / WhatsApp
                </label>
                <input
                  id="phone"
                  className="input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  required
                />
              </div>
              <div className="profile-field">
                <label className="label" htmlFor="email-readonly">
                  Email
                </label>
                <input id="email-readonly" className="input" value={user.email} disabled />
              </div>
            </div>
          </div>

          <div className="profile-section">
            <div className="profile-section__label">
              <MapPin size={15} />
              Alamat
            </div>
            <div className="profile-grid">
              <div className="profile-field profile-field--wide">
                <label className="label" htmlFor="address">
                  Alamat lengkap
                </label>
                <textarea
                  id="address"
                  className="input profile-textarea"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Jalan, nomor, RT/RW, kelurahan..."
                  required
                />
              </div>
              <div className="profile-field profile-field--wide">
                <WilayahSelects
                  key={wilayahKey}
                  idPrefix="profile"
                  province={province}
                  city={city}
                  postalCode={postalCode}
                  onChange={(next) => {
                    setProvince(next.province);
                    setCity(next.city);
                    setPostalCode(next.postalCode);
                  }}
                />
              </div>
            </div>
          </div>

          {(message || error) && (
            <div className={`profile-alert ${error ? "is-error" : "is-ok"}`}>
              {error || message}
            </div>
          )}

          <div className="profile-sheet__foot">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving
                ? "Menyimpan..."
                : next === "/checkout"
                  ? "Simpan & lanjut checkout"
                  : "Simpan profil"}
            </button>
            {next === "/checkout" && (
              <Link href="/checkout" className="btn btn-ghost">
                Kembali ke checkout
              </Link>
            )}
          </div>
        </form>

        <aside className="profile-side">
          <div className="profile-side__card">
            <h3 className="display">Checklist</h3>
            <p>Lengkapi ketiga poin ini agar bisa checkout.</p>
            <ul className="profile-checks">
              {checks.map((item) => (
                <li key={item.label} className={item.done ? "is-done" : ""}>
                  <span className="profile-checks__icon" aria-hidden>
                    {item.done ? <Check size={12} strokeWidth={3} /> : null}
                  </span>
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="profile-side__tip">
            <strong>Tips</strong>
            <p>
              Pastikan nomor WhatsApp aktif — konfirmasi pembayaran dan update pengiriman dikirim ke
              sana.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<PageLoading label="Menyiapkan profil" variant="profile" />}>
      <ProfileForm />
    </Suspense>
  );
}
