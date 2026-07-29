import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-store py-24 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--brand-deep)]">404</p>
      <h1 className="display mt-3 text-4xl font-bold">Halaman tidak ditemukan</h1>
      <p className="mt-3 text-[var(--muted)]">Produk atau URL yang kamu cari tidak tersedia.</p>
      <Link href="/" className="btn btn-primary mt-8">
        Kembali ke beranda
      </Link>
    </div>
  );
}
