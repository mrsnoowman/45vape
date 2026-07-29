"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Plus } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { ProductDTO } from "@/lib/types";
import { formatIDR } from "@/lib/format";
import { categoryLabel } from "@/lib/catalog-meta";
import { useCartStore } from "@/store/cart-store";
import { useUiStore } from "@/store/ui-store";
import { useWishlistStore } from "@/store/wishlist-store";

export function ProductCard({ product, index = 0 }: { product: ProductDTO; index?: number }) {
  const addItem = useCartStore((s) => s.addItem);
  const pushToast = useUiStore((s) => s.pushToast);
  const flyToCart = useUiStore((s) => s.flyToCart);
  const wishIds = useWishlistStore((s) => s.ids);
  const toggleWish = useWishlistStore((s) => s.toggle);
  const btnRef = useRef<HTMLButtonElement>(null);

  const nicVariants = useMemo(
    () => product.variants.filter((v) => Boolean(v.nic)),
    [product.variants],
  );
  const hasNicOptions = nicVariants.length > 0;
  const wished = wishIds.includes(product.id);

  const [variantId, setVariantId] = useState(
    () => (hasNicOptions ? nicVariants[0]?.id : product.variants[0]?.id) ?? 0,
  );
  const [bump, setBump] = useState(false);
  const [busy, setBusy] = useState(false);

  const selected = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const hasDiscount = (selected?.discountPercent ?? 0) > 0;
  const soldOut = !selected || selected.stock <= 0;
  const price = selected?.effectivePrice ?? product.minPrice;

  const onAdd = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!selected || busy || soldOut) return;
    setBusy(true);

    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      flyToCart({
        image: product.image,
        fromX: rect.left + rect.width / 2,
        fromY: rect.top + rect.height / 2,
      });
    }

    const res = await addItem(selected.id, 1);
    setBusy(false);
    setBump(true);
    window.setTimeout(() => setBump(false), 500);

    if (res.ok) {
      pushToast({
        title: "Ditambahkan ke keranjang",
        subtitle: `${product.name}${selected.nic ? ` · ${selected.nic}` : ""}`,
        tone: "success",
      });
    } else {
      pushToast({ title: res.message, tone: "error" });
    }
  };

  const onWish = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { added } = toggleWish(product.id);
    pushToast({
      title: added ? "Ditambahkan ke favorit" : "Dihapus dari favorit",
      subtitle: product.name,
      tone: "info",
    });
  };

  const pickNic = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setVariantId(id);
  };

  return (
    <article
      className={`product-card group ${bump ? "is-bump" : ""} ${soldOut ? "is-soldout" : ""}`}
      style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}
    >
      <div className="product-card__media">
        <Link href={`/product/${product.slug}`} className="product-card__media-link" tabIndex={-1}>
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width:768px) 50vw, (max-width:1280px) 25vw, 20vw"
            className="object-contain p-4 transition duration-500 ease-out group-hover:scale-[1.05]"
          />
        </Link>

        <div className="product-card__badges">
          {hasDiscount && selected ? (
            <span className="product-card__sale">-{selected.discountPercent}%</span>
          ) : (
            <span className="product-card__cat">{categoryLabel(product.category)}</span>
          )}
          {soldOut && <span className="product-card__sold">Habis</span>}
        </div>

        <button
          type="button"
          className={`product-card__wish ${wished ? "is-active" : ""}`}
          onClick={onWish}
          aria-label={wished ? "Hapus dari favorit" : "Tambah ke favorit"}
          aria-pressed={wished}
        >
          <Heart size={15} strokeWidth={2.2} fill={wished ? "currentColor" : "none"} />
        </button>

        <button
          ref={btnRef}
          type="button"
          className="product-card__quick-add"
          onClick={onAdd}
          disabled={soldOut || busy}
          aria-label={soldOut ? "Habis" : "Tambah ke keranjang"}
        >
          {busy ? "…" : <Plus size={16} strokeWidth={2.5} />}
        </button>
      </div>

      <div className="product-card__body">
        <p className="product-card__brand">{product.brand}</p>

        <Link href={`/product/${product.slug}`} className="product-card__name">
          {product.name}
        </Link>

        <div className="product-card__meta">
          {hasNicOptions ? (
            <div className="product-card__nics" role="group" aria-label="Pilih NIC">
              {nicVariants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className={`product-card__nic ${v.id === selected?.id ? "is-active" : ""}`}
                  onClick={(e) => pickNic(v.id, e)}
                  disabled={v.stock <= 0}
                  title={v.stock <= 0 ? "Habis" : `NIC ${v.nic}`}
                >
                  {v.nic}
                </button>
              ))}
            </div>
          ) : (
            <span className="product-card__tag">{categoryLabel(product.category)}</span>
          )}
        </div>

        <div className="product-card__foot">
          <div className="product-card__price-block">
            <p className="product-card__price">
              <span className="product-card__currency">Rp</span>
              <strong>{price.toLocaleString("id-ID")}</strong>
            </p>
            {hasDiscount && selected && (
              <span className="product-card__price-was">{formatIDR(selected.price)}</span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
