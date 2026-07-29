"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { ProductDescription, descriptionLead } from "@/components/ProductDescription";
import type { ProductDTO } from "@/lib/types";
import { categoryLabel } from "@/lib/catalog-meta";
import { formatIDR } from "@/lib/format";
import { useCartStore } from "@/store/cart-store";
import { useUiStore } from "@/store/ui-store";

function highlightFor(category: string) {
  const map: Record<string, string[]> = {
    liquid: [
      "Rasa konsisten dari puff pertama",
      "Cocok untuk daily vape",
      "Varian NIC jelas & transparan",
    ],
    pod: [
      "Siap pakai tanpa ribet",
      "Build quality solid",
      "Draw nyaman untuk sehari-hari",
    ],
    mod: [
      "Performa stabil",
      "Desain premium & grip nyaman",
      "Cocok flavor maupun cloud",
    ],
    atomizer: [
      "Flavor-focused airflow",
      "Mudah di-setup",
      "Finishing rapi",
    ],
    accessories: [
      "Komponen pendukung penting",
      "Meningkatkan pengalaman vape",
      "Original & siap pakai",
    ],
  };
  return map[category] ?? ["Original 45 Vape", "Kualitas terkurasi", "Siap kirim"];
}

export default function ProductDetailClient({
  product,
  related,
}: {
  product: ProductDTO;
  related: ProductDTO[];
}) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useUiStore((s) => s.openCart);
  const pushToast = useUiStore((s) => s.pushToast);
  const flyToCart = useUiStore((s) => s.flyToCart);
  const addBtnRef = useRef<HTMLButtonElement>(null);

  const gallery = product.gallery?.length ? product.gallery : [product.image];
  const [activeImage, setActiveImage] = useState(0);
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? 0);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);

  const variant = useMemo(
    () => product.variants.find((v) => v.id === variantId) ?? product.variants[0],
    [product.variants, variantId]
  );

  const highlights = highlightFor(product.category);
  const current = gallery[activeImage] ?? product.image;

  const onAdd = async () => {
    if (!variant) return;
    setLoading(true);
    const rect = addBtnRef.current?.getBoundingClientRect();
    if (rect) {
      flyToCart({
        image: product.image,
        fromX: rect.left + rect.width / 2,
        fromY: rect.top + rect.height / 2,
      });
    }
    const res = await addItem(variant.id, qty);
    setLoading(false);
    if (res.ok) {
      pushToast({
        title: "Ditambahkan ke keranjang",
        subtitle: `${product.name}${variant.nic ? ` · ${variant.nic}` : ""} × ${qty}`,
        tone: "success",
      });
    } else {
      pushToast({ title: res.message, tone: "error" });
    }
  };

  const shiftGallery = (dir: -1 | 1) => {
    setActiveImage((i) => (i + dir + gallery.length) % gallery.length);
  };

  return (
    <div className="pdp">
      <div className="container-store py-5 md:py-10">
        <nav className="pdp__crumb animate-rise">
          <Link href="/">Beranda</Link>
          <span>/</span>
          <Link href={`/products?category=${product.category}`}>
            {categoryLabel(product.category)}
          </Link>
          <span>/</span>
          <span className="pdp__crumb-current">{product.name}</span>
        </nav>

        <div className="pdp__grid">
          {/* Gallery */}
          <div className="pdp__gallery animate-rise">
            <div className="pdp__stage">
              {variant?.discountPercent > 0 && (
                <span className="pdp__sale">-{variant.discountPercent}%</span>
              )}
              <Image
                src={current}
                alt={product.name}
                fill
                priority
                className="object-contain p-8 md:p-12"
                sizes="(max-width:1024px) 100vw, 52vw"
              />
              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    className="pdp__nav pdp__nav--prev"
                    aria-label="Gambar sebelumnya"
                    onClick={() => shiftGallery(-1)}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    className="pdp__nav pdp__nav--next"
                    aria-label="Gambar berikutnya"
                    onClick={() => shiftGallery(1)}
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>

            {gallery.length > 1 && (
              <div className="pdp__thumbs">
                {gallery.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    className={`pdp__thumb ${i === activeImage ? "is-active" : ""}`}
                    onClick={() => setActiveImage(i)}
                    aria-label={`Gambar ${i + 1}`}
                  >
                    <Image src={src} alt="" fill className="object-contain p-2" sizes="80px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Buy box */}
          <div className="pdp__buy animate-rise-delay">
            <div className="pdp__badges">
              <span className="badge">{product.brand}</span>
              <span className="badge !bg-[var(--navy-deep)] !text-white">
                {categoryLabel(product.category)}
              </span>
              {product.subcategory && (
                <span className="badge !bg-white !border !border-[var(--line)]">
                  {product.subcategory}
                </span>
              )}
            </div>

            <h1 className="display pdp__title">{product.name}</h1>
            <p className="pdp__lead">
              {descriptionLead(
                product.description,
                `${product.name} original dari ${product.brand}.`,
              )}
            </p>

            <div className="pdp__price-box">
              <div className="pdp__price">{formatIDR(variant?.effectivePrice ?? 0)}</div>
              {variant && variant.discountPercent > 0 && (
                <div className="pdp__price-meta">
                  <span className="price-strike">{formatIDR(variant.price)}</span>
                  <span className="pdp__save">Hemat {variant.discountPercent}%</span>
                </div>
              )}
            </div>

            {product.variants.some((v) => v.nic) && (
              <div className="pdp__block">
                <div className="label">Pilih NIC</div>
                <div className="pdp__nics">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setVariantId(v.id);
                        setQty(1);
                      }}
                      disabled={v.stock <= 0}
                      className={`pdp__nic ${v.id === variant?.id ? "is-active" : ""}`}
                    >
                      {v.nic}
                      {v.stock <= 0 && <small>habis</small>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pdp__block">
              <div className="label">Jumlah</div>
              <div className="pdp__qty-row">
                <div className="pdp__qty">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    aria-label="Kurangi"
                  >
                    <Minus size={16} />
                  </button>
                  <span>{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.min(variant?.stock ?? 1, q + 1))}
                    aria-label="Tambah"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <p className="pdp__stock">
                  <Package size={14} /> Stok {variant?.stock ?? 0}
                </p>
              </div>
            </div>

            <div className="pdp__cta">
              <button
                ref={addBtnRef}
                type="button"
                onClick={onAdd}
                disabled={!variant || variant.stock <= 0 || loading}
                className="btn btn-primary flex-1"
              >
                <ShoppingBag size={18} />
                {loading ? "Menambahkan..." : "Tambah ke Keranjang"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={openCart}>
                Lihat Cart
              </button>
            </div>

            <div className="pdp__perks">
              <div>
                <ShieldCheck size={16} /> Original
              </div>
              <div>
                <Truck size={16} /> Kirim cepat
              </div>
              <div>
                <CheckCircle2 size={16} /> Stok real-time
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <section className="pdp__desc-grid">
          <div className="pdp__panel animate-rise">
            <p className="section-kicker">Deskripsi produk</p>
            <h2 className="display section-title !mt-1">Detail lengkap</h2>
            <ProductDescription text={product.description} />
            <ul className="pdp__highlights">
              {highlights.map((item) => (
                <li key={item}>
                  <CheckCircle2 size={16} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="pdp__panel pdp__specs animate-rise-delay">
            <p className="section-kicker">Spesifikasi</p>
            <h2 className="display text-[1.55rem] md:text-[1.75rem] mt-1 mb-4">Informasi produk</h2>
            <dl className="pdp__spec-list">
              <div>
                <dt>Brand</dt>
                <dd>{product.brand}</dd>
              </div>
              <div>
                <dt>Kategori</dt>
                <dd>{categoryLabel(product.category)}</dd>
              </div>
              {product.subcategory && (
                <div>
                  <dt>Subkategori</dt>
                  <dd className="capitalize">{product.subcategory}</dd>
                </div>
              )}
              <div>
                <dt>Varian</dt>
                <dd>
                  {product.variants.map((v) => v.nic).filter(Boolean).join(", ") || "Standard"}
                </dd>
              </div>
              <div>
                <dt>Total stok</dt>
                <dd>{product.totalStock} unit</dd>
              </div>
              <div>
                <dt>Harga mulai</dt>
                <dd>{formatIDR(product.minPrice)}</dd>
              </div>
            </dl>
          </div>
        </section>

        {related.length > 0 && (
          <section className="mt-12 md:mt-16">
            <div className="mb-6 flex items-end justify-between gap-3">
              <div>
                <p className="section-kicker">Rekomendasi</p>
                <h2 className="display section-title">Produk serupa</h2>
              </div>
              <Link
                href={`/products?category=${product.category}`}
                className="text-sm font-bold text-[var(--navy)]"
              >
                Lihat semua →
              </Link>
            </div>
            <div className="product-grid">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
