"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SITE_LOGO, SITE_NAME } from "@/lib/seo";

const STORAGE_KEY = "45vape-age-ok";

export function AgeGate() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/admin")) {
      setReady(true);
      setOpen(false);
      return;
    }
    try {
      const ok = window.localStorage.getItem(STORAGE_KEY) === "1";
      setOpen(!ok);
      setBlocked(false);
    } catch {
      setOpen(true);
    }
    setReady(true);
  }, [pathname]);

  useEffect(() => {
    if (!ready) return;
    if (open || blocked) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [ready, open, blocked]);

  if (!ready || pathname.startsWith("/admin")) return null;
  if (!open && !blocked) return null;

  const confirmAge = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
    setBlocked(false);
  };

  const denyAge = () => {
    setOpen(false);
    setBlocked(true);
  };

  return (
    <div className="age-gate" role="dialog" aria-modal="true" aria-labelledby="age-gate-title">
      <div className="age-gate__backdrop" aria-hidden />
      <div className="age-gate__card">
        <div className="age-gate__logo">
          <Image
            src={SITE_LOGO}
            alt={SITE_NAME}
            width={120}
            height={120}
            className="age-gate__logo-img"
            priority
          />
        </div>

        {blocked ? (
          <>
            <p className="age-gate__kicker">Akses ditolak</p>
            <h2 id="age-gate-title" className="display age-gate__title">
              Konten khusus usia 21+
            </h2>
            <p className="age-gate__text">
              Maaf, situs 45 Vape hanya untuk pengunjung berusia 21 tahun ke atas.
            </p>
            <a href="https://www.google.com" className="btn btn-ghost age-gate__btn">
              Keluar dari situs
            </a>
          </>
        ) : (
          <>
            <p className="age-gate__kicker">Age verification</p>
            <h2 id="age-gate-title" className="display age-gate__title">
              Apakah kamu sudah 21 tahun?
            </h2>
            <p className="age-gate__text">
              Produk vape mengandung nikotin dan hanya untuk dewasa berusia{" "}
              <strong>21 tahun ke atas</strong>. Konfirmasi usia untuk melanjutkan.
            </p>
            <div className="age-gate__actions">
              <button type="button" className="btn btn-primary age-gate__btn" onClick={confirmAge}>
                Saya 21+
              </button>
              <button type="button" className="btn btn-ghost age-gate__btn" onClick={denyAge}>
                Di bawah 21
              </button>
            </div>
            <p className="age-gate__note">Dengan masuk, kamu menyatakan usia legal untuk mengakses situs ini.</p>
          </>
        )}
      </div>
    </div>
  );
}
