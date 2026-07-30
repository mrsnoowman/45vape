"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { Lock, Mail } from "lucide-react";
import { PageLoading } from "@/components/PageLoading";
import { useAuthStore } from "@/store/auth-store";

function LoginForm() {
  const login = useAuthStore((s) => s.login);
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/profile";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await login(email, password);
    setLoading(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    router.push(next);
  };

  return (
    <div className="auth-page">
      <div className="auth-modal auth-page__panel">
        <div className="auth-modal__brand">
          <Image
            src="/brand/IMG_3820.PNG"
            alt="45 Vape"
            width={64}
            height={64}
            className="auth-modal__logo-img"
            priority
          />
          <div>
            <p className="auth-modal__brand-name">45 Vape</p>
            <p className="auth-modal__brand-sub">Official Store Member</p>
          </div>
        </div>

        <div className="auth-modal__tabs">
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="is-active"
            aria-current="page"
          >
            Masuk
          </Link>
          <Link href={`/register?next=${encodeURIComponent(next)}`}>Daftar</Link>
        </div>

        <form onSubmit={onSubmit} className="auth-modal__form">
          <div className="auth-modal__field">
            <label className="label" htmlFor="email">
              Email
            </label>
            <div className="auth-modal__input-wrap">
              <Mail size={16} className="auth-modal__input-icon" />
              <input
                id="email"
                type="email"
                className="input auth-modal__input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div className="auth-modal__field">
            <label className="label" htmlFor="password">
              Password
            </label>
            <div className="auth-modal__input-wrap">
              <Lock size={16} className="auth-modal__input-icon" />
              <input
                id="password"
                type="password"
                className="input auth-modal__input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                required
                minLength={6}
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && <p className="auth-modal__error">{error}</p>}

          <button type="submit" className="btn btn-primary auth-modal__submit" disabled={loading}>
            {loading ? "Memproses..." : "Masuk Sekarang"}
          </button>
        </form>

        <p className="auth-modal__footer-note">
          Belum punya akun?{" "}
          <Link href={`/register?next=${encodeURIComponent(next)}`}>Daftar</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoading label="Menyiapkan halaman masuk" />}>
      <LoginForm />
    </Suspense>
  );
}
