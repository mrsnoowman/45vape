"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Headphones, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { Reveal } from "@/components/home/Reveal";
import { useUiStore } from "@/store/ui-store";
import { STORE, whatsappUrl } from "@/lib/store";

const TRUST = [
  { icon: Truck, title: "Pengiriman cepat", text: "Jakarta & seluruh Indonesia" },
  { icon: PackageCheck, title: "Stok real-time", text: "Varian NIC selalu update" },
  { icon: ShieldCheck, title: "100% original", text: "Brand terkurasi & autentik" },
  { icon: Headphones, title: "Bantuan ahli", text: "Bantu pilih device & liquid" },
];

export function PromiseStrip() {
  return (
    <section className="home-trust container-store">
      <div className="trust-strip">
        {TRUST.map((item, i) => (
          <Reveal key={item.title} delay={i * 40} className="h-full">
            <article className="trust-strip__item">
              <div className="trust-strip__icon" aria-hidden>
                <item.icon size={18} strokeWidth={2.1} />
              </div>
              <div className="trust-strip__copy">
                <strong>{item.title}</strong>
                <span>{item.text}</span>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function HomeStory() {
  return (
    <section className="home-story container-store">
      <Reveal>
        <div className="story-panel">
          <div className="story-panel__media">
            <Image
              src="/banners/2.jpg"
              alt="Koleksi 45 Vape"
              fill
              className="object-cover"
              sizes="(max-width:900px) 100vw, 48vw"
            />
            <div className="story-panel__shade" />
            <p className="story-panel__caption">Kurasi rasa & device pilihan</p>
          </div>

          <div className="story-panel__copy">
            <p className="section-kicker">Tentang toko</p>
            <h2 className="display story-panel__title">
              Belanja vape yang rapi, jelas, dan siap kirim
            </h2>
            <p className="story-panel__text">
              45 Vape menyiapkan liquid, pod, dan aksesoris original dengan stok yang
              transparan. Pilih NIC, masukkan keranjang, lalu checkout dengan tenang.
            </p>

            <ul className="story-panel__list">
              <li>Katalog terkurasi — bukan barang acak</li>
              <li>Harga & diskon terlihat jelas di setiap produk</li>
              <li>Bantuan lewat WhatsApp jika butuh rekomendasi</li>
            </ul>

            <div className="story-panel__actions">
              <Link href="/products" className="btn btn-primary">
                Jelajahi katalog
                <ArrowRight size={15} />
              </Link>
              <a
                href={whatsappUrl("Halo 45 Vape, saya ingin tanya rekomendasi produk.")}
                target="_blank"
                rel="noreferrer"
                className="story-panel__wa"
              >
                <MessageCircle size={16} />
                Chat {STORE.name}
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function ExperienceBand() {
  return (
    <section className="home-flow container-store">
      <Reveal>
        <div className="flow-band">
          <div className="flow-band__copy">
            <p className="flow-band__kicker">Cara belanja</p>
            <h2 className="display flow-band__title">Dari keranjang sampai checkout</h2>
            <p className="flow-band__text">
              Belanja dulu sebagai guest. Login saat checkout, isi alamat, lalu selesaikan
              pembayaran.
            </p>
          </div>
          <ol className="flow-band__steps">
            {[
              ["01", "Pilih produk"],
              ["02", "Masuk keranjang"],
              ["03", "Lengkapi profil"],
              ["04", "Checkout"],
            ].map(([n, t]) => (
              <li key={n} className="flow-step">
                <span>{n}</span>
                <strong>{t}</strong>
              </li>
            ))}
          </ol>
        </div>
      </Reveal>
    </section>
  );
}

export function SoftCta() {
  const openAuth = useUiStore((s) => s.openAuth);

  return (
    <section className="home-cta container-store">
      <Reveal>
        <div className="soft-cta">
          <div>
            <p className="section-kicker">Member</p>
            <h2 className="display soft-cta__title">Siap checkout lebih cepat?</h2>
            <p className="soft-cta__text">
              Simpan alamat di profil supaya order berikutnya lebih ringkas.
            </p>
          </div>
          <div className="soft-cta__actions">
            <button type="button" className="btn btn-primary" onClick={() => openAuth("register")}>
              Buat akun
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => openAuth("login")}>
              Masuk
            </button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
