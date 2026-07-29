import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container-store grid gap-8 py-12 md:grid-cols-[1.4fr_1fr_1fr] md:gap-10 md:py-14">
        <div>
          <div className="footer-brand">
            <Image
              src="/brand/45vape-group.webp"
              alt="45 Vape Group"
              width={96}
              height={96}
              className="footer-brand__logo"
            />
            <div>
              <div className="display footer-brand__name">45 Vape</div>
              <div className="footer-brand__sub">Official Store</div>
            </div>
          </div>
          <p className="m-0 max-w-sm text-sm leading-relaxed text-white/65">
            Liquid, device, dan aksesoris original. Belanja rapi — dari keranjang sampai pengiriman.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-white/45">Jelajahi</h3>
          <div className="flex flex-col gap-2.5 text-sm text-white/75">
            <Link href="/products?category=liquid" className="hover:text-white">
              Liquid
            </Link>
            <Link href="/products?category=pod" className="hover:text-white">
              Pod
            </Link>
            <Link href="/products?category=mod" className="hover:text-white">
              Mod
            </Link>
            <Link href="/kontak" className="hover:text-white">
              Kontak & Cabang
            </Link>
            <Link href="/orders" className="hover:text-white">
              Status Pesanan
            </Link>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-white/45">Kontak</h3>
          <div className="space-y-2.5 text-sm text-white/75">
            <a href="tel:+6281387884545" className="flex items-center gap-2 hover:text-white">
              <Phone size={15} /> +62 813-8788-4545
            </a>
            <a href="mailto:45vapegroup@gmail.com" className="flex items-center gap-2 hover:text-white">
              <Mail size={15} /> 45vapegroup@gmail.com
            </a>
            <p className="m-0 flex items-start gap-2 text-white/55">
              <MapPin size={15} className="mt-0.5 shrink-0" />
              Bekasi, Indonesia · 21+ only
            </p>
            <Link href="/kontak#cabang" className="hover:text-white">
              Lihat cabang →
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-3.5 text-center text-xs text-white/40">
        © {new Date().getFullYear()} 45 Vape. All rights reserved.
      </div>
    </footer>
  );
}
