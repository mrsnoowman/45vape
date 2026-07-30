"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { Lock, Mail, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";

export function AuthModal() {
  const open = useUiStore((s) => s.authOpen);
  const tab = useUiStore((s) => s.authTab);
  const next = useUiStore((s) => s.authNext);
  const closeAuth = useUiStore((s) => s.closeAuth);
  const setAuthTab = useUiStore((s) => s.setAuthTab);
  const pushToast = useUiStore((s) => s.pushToast);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res =
      tab === "login"
        ? await login(email, password)
        : await register(email, password, confirm);
    setLoading(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    pushToast({
      title: tab === "login" ? "Login berhasil" : "Akun dibuat",
      subtitle: "Keranjang guest otomatis digabung",
      tone: "success",
    });
    closeAuth();
    setEmail("");
    setPassword("");
    setConfirm("");
    if (next) router.push(next);
  };

  return (
    <div className="ui-overlay" role="dialog" aria-modal="true" aria-label="Login">
      <button type="button" className="ui-overlay__backdrop" aria-label="Tutup" onClick={closeAuth} />
      <div className="auth-modal">
        <button type="button" className="auth-modal__close" onClick={closeAuth} aria-label="Tutup">
          <X size={18} />
        </button>

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
          <button
            type="button"
            className={tab === "login" ? "is-active" : ""}
            onClick={() => {
              setAuthTab("login");
              setError("");
            }}
          >
            Masuk
          </button>
          <button
            type="button"
            className={tab === "register" ? "is-active" : ""}
            onClick={() => {
              setAuthTab("register");
              setError("");
            }}
          >
            Daftar
          </button>
        </div>

        <form onSubmit={onSubmit} className="auth-modal__form">
          <div className="auth-modal__field">
            <label className="label" htmlFor="auth-email">
              Email
            </label>
            <div className="auth-modal__input-wrap">
              <Mail size={16} className="auth-modal__input-icon" />
              <input
                id="auth-email"
                type="email"
                className="input auth-modal__input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="auth-modal__field">
            <label className="label" htmlFor="auth-password">
              Password
            </label>
            <div className="auth-modal__input-wrap">
              <Lock size={16} className="auth-modal__input-icon" />
              <input
                id="auth-password"
                type="password"
                className="input auth-modal__input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                required
                minLength={6}
              />
            </div>
          </div>

          {tab === "register" && (
            <div className="auth-modal__field">
              <label className="label" htmlFor="auth-confirm">
                Konfirmasi Password
              </label>
              <div className="auth-modal__input-wrap">
                <Lock size={16} className="auth-modal__input-icon" />
                <input
                  id="auth-confirm"
                  type="password"
                  className="input auth-modal__input"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Ulangi password"
                  required
                  minLength={6}
                />
              </div>
            </div>
          )}

          {error && <p className="auth-modal__error">{error}</p>}

          <button type="submit" className="btn btn-primary auth-modal__submit" disabled={loading}>
            {loading ? "Memproses..." : tab === "login" ? "Masuk Sekarang" : "Daftar Sekarang"}
          </button>
        </form>

        {tab === "register" && (
          <p className="auth-modal__footer-note">
            Sudah punya akun?{" "}
            <button
              type="button"
              onClick={() => {
                setAuthTab("login");
                setError("");
              }}
            >
              Masuk di sini
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
