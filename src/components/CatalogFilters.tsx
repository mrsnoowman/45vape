"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { Check, Filter, RotateCcw, SlidersHorizontal, Tag, X } from "lucide-react";
import { CATEGORIES, categoryLabel, categorySubs, subcategoryLabel } from "@/lib/catalog-meta";
import {
  CatalogQuery,
  PRICE_PRESETS,
  SORT_OPTIONS,
  countActiveFilters,
  productsHref,
} from "@/lib/catalog-filters";

type BrandFacet = { slug: string; name: string; count: number };

type Props = {
  query: CatalogQuery;
  brands: BrandFacet[];
  categoryCounts: Record<string, number>;
  totalAll: number;
  resultCount: number;
  children: ReactNode;
};

export function CatalogShell({
  query,
  brands,
  categoryCounts,
  totalAll,
  resultCount,
  children,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState(query.min || "");
  const [max, setMax] = useState(query.max || "");

  useEffect(() => {
    setMin(query.min || "");
    setMax(query.max || "");
  }, [query.min, query.max]);

  useEffect(() => {
    setOpen(false);
  }, [query]);

  const active = countActiveFilters(query);
  const subOptions = categorySubs(query.category);
  const subs = subOptions.length
    ? [{ slug: "", label: `Semua ${categoryLabel(query.category || "").toLowerCase()}` }, ...subOptions]
    : null;

  const chips = useMemo(() => {
    const list: { key: string; label: string; href: string }[] = [];
    if (query.q) {
      list.push({
        key: "q",
        label: `Cari: “${query.q}”`,
        href: productsHref({ ...query, q: undefined }),
      });
    }
    if (query.category && query.category !== "all") {
      list.push({
        key: "category",
        label: categoryLabel(query.category),
        href: productsHref({ ...query, category: undefined, subcategory: undefined }),
      });
    }
    if (query.subcategory) {
      list.push({
        key: "sub",
        label: subcategoryLabel(query.category, query.subcategory),
        href: productsHref({ ...query, subcategory: undefined }),
      });
    }
    if (query.brand) {
      const brand = brands.find((b) => b.slug === query.brand);
      list.push({
        key: "brand",
        label: brand?.name || query.brand,
        href: productsHref({ ...query, brand: undefined }),
      });
    }
    if (query.min || query.max) {
      const minLabel = query.min ? `Rp${Number(query.min).toLocaleString("id-ID")}` : "0";
      const maxLabel = query.max ? `Rp${Number(query.max).toLocaleString("id-ID")}` : "∞";
      list.push({
        key: "price",
        label: `${minLabel} – ${maxLabel}`,
        href: productsHref({ ...query, min: undefined, max: undefined }),
      });
    }
    if (query.stock === "1") {
      list.push({
        key: "stock",
        label: "Stok tersedia",
        href: productsHref({ ...query, stock: undefined }),
      });
    }
    if (query.sale === "1") {
      list.push({
        key: "sale",
        label: "Sedang diskon",
        href: productsHref({ ...query, sale: undefined }),
      });
    }
    return list;
  }, [query, brands]);

  const go = (next: CatalogQuery) => {
    router.push(productsHref(next));
  };

  const onPriceSubmit = (e: FormEvent) => {
    e.preventDefault();
    go({
      ...query,
      min: min.replace(/[^\d]/g, "") || undefined,
      max: max.replace(/[^\d]/g, "") || undefined,
    });
  };

  const panel = (
    <div className="catalog-filters__inner">
      <div className="catalog-filters__top">
        <div className="catalog-filters__brand">
          <span className="catalog-filters__icon" aria-hidden>
            <Filter size={15} strokeWidth={2.25} />
          </span>
          <div>
            <h2 className="catalog-filters__title">Filter</h2>
            <p className="catalog-filters__sub">
              {active > 0 ? `${active} aktif` : `${totalAll} produk`}
            </p>
          </div>
        </div>
        {active > 0 ? (
          <Link href="/products" className="catalog-filters__reset">
            <RotateCcw size={12} />
            Reset
          </Link>
        ) : null}
      </div>

      <section className="catalog-filters__section">
        <h3>Kategori</h3>
        <div className="catalog-filters__stack">
          {CATEGORIES.map((cat) => {
            const count = cat.slug === "all" ? totalAll : categoryCounts[cat.slug] || 0;
            const activeCat =
              (query.category ?? "all") === cat.slug ||
              (!query.category && cat.slug === "all");
            return (
              <Link
                key={cat.slug}
                href={productsHref({
                  ...query,
                  category: cat.slug === "all" ? undefined : cat.slug,
                  subcategory: undefined,
                })}
                className={`catalog-filters__option ${activeCat ? "is-active" : ""}`}
              >
                <span className="catalog-filters__check" aria-hidden>
                  {activeCat ? <Check size={11} strokeWidth={3} /> : null}
                </span>
                <span className="catalog-filters__label">{cat.label}</span>
                <em>{count}</em>
              </Link>
            );
          })}
        </div>
      </section>

      {subs && (
        <section className="catalog-filters__section">
          <h3>Tipe</h3>
          <div className="catalog-filters__chips">
            {subs.map((sub) => (
              <Link
                key={sub.slug || "all-sub"}
                href={productsHref({
                  ...query,
                  subcategory: sub.slug || undefined,
                })}
                className={`catalog-chip ${(query.subcategory || "") === sub.slug ? "is-active" : ""}`}
              >
                {sub.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="catalog-filters__section">
        <h3>Brand</h3>
        <div className="catalog-filters__stack catalog-filters__stack--scroll">
          <Link
            href={productsHref({ ...query, brand: undefined })}
            className={`catalog-filters__option ${!query.brand ? "is-active" : ""}`}
          >
            <span className="catalog-filters__check" aria-hidden>
              {!query.brand ? <Check size={11} strokeWidth={3} /> : null}
            </span>
            <span className="catalog-filters__label">Semua brand</span>
            <em>{totalAll}</em>
          </Link>
          {brands.map((brand) => (
            <Link
              key={brand.slug}
              href={productsHref({ ...query, brand: brand.slug })}
              className={`catalog-filters__option ${query.brand === brand.slug ? "is-active" : ""}`}
              title={brand.name}
            >
              <span className="catalog-filters__check" aria-hidden>
                {query.brand === brand.slug ? <Check size={11} strokeWidth={3} /> : null}
              </span>
              <span className="catalog-filters__label">{brand.name}</span>
              <em>{brand.count}</em>
            </Link>
          ))}
        </div>
      </section>

      <section className="catalog-filters__section">
        <h3>Harga</h3>
        <div className="catalog-filters__price-grid">
          {PRICE_PRESETS.map((preset) => {
            const activePreset =
              (query.min || "") === preset.min && (query.max || "") === preset.max;
            return (
              <button
                key={preset.label}
                type="button"
                className={`catalog-price-tile ${activePreset ? "is-active" : ""}`}
                onClick={() =>
                  go({
                    ...query,
                    min: preset.min || undefined,
                    max: preset.max || undefined,
                  })
                }
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <form className="catalog-price-form" onSubmit={onPriceSubmit}>
          <div className="catalog-price-form__fields">
            <label>
              <span>Min</span>
              <input
                inputMode="numeric"
                placeholder="0"
                value={min}
                onChange={(e) => setMin(e.target.value)}
              />
            </label>
            <span className="catalog-price-form__sep" aria-hidden>
              –
            </span>
            <label>
              <span>Max</span>
              <input
                inputMode="numeric"
                placeholder="∞"
                value={max}
                onChange={(e) => setMax(e.target.value)}
              />
            </label>
          </div>
          <button type="submit" className="catalog-price-form__go">
            Terapkan
          </button>
        </form>
      </section>

      <section className="catalog-filters__section catalog-filters__section--last">
        <h3>Lainnya</h3>
        <div className="catalog-filters__toggles">
          <button
            type="button"
            className={`catalog-toggle ${query.stock === "1" ? "is-on" : ""}`}
            onClick={() =>
              go({
                ...query,
                stock: query.stock === "1" ? undefined : "1",
              })
            }
          >
            <span>
              <strong>Stok tersedia</strong>
              <small>Sembunyikan yang habis</small>
            </span>
            <i aria-hidden />
          </button>
          <button
            type="button"
            className={`catalog-toggle ${query.sale === "1" ? "is-on" : ""}`}
            onClick={() =>
              go({
                ...query,
                sale: query.sale === "1" ? undefined : "1",
              })
            }
          >
            <span>
              <strong>Sedang diskon</strong>
              <small>Hanya produk promo</small>
            </span>
            <i aria-hidden />
          </button>
        </div>
      </section>
    </div>
  );

  return (
    <div className="catalog-layout">
      <aside className="catalog-filters">{panel}</aside>

      <div className="catalog-main">
        <div className="catalog-toolbar">
          <div className="catalog-toolbar__meta">
            <strong>{resultCount}</strong>
            <span>produk</span>
            {active > 0 && <em>{active} filter aktif</em>}
          </div>
          <div className="catalog-toolbar__actions">
            <label className="catalog-sort">
              <SlidersHorizontal size={14} aria-hidden />
              <select
                value={query.sort || "featured"}
                onChange={(e) => go({ ...query, sort: e.target.value })}
                aria-label="Urutkan produk"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="btn btn-ghost catalog-toolbar__filter-btn"
              onClick={() => setOpen(true)}
            >
              <Filter size={15} aria-hidden />
              <span>Filter{active > 0 ? ` · ${active}` : ""}</span>
            </button>
          </div>
        </div>

        {chips.length > 0 && (
          <div className="catalog-active">
            {chips.map((chip) => (
              <Link key={chip.key} href={chip.href} className="catalog-active__chip">
                <Tag size={11} />
                {chip.label}
                <X size={12} />
              </Link>
            ))}
            <Link href="/products" className="catalog-active__clear">
              Hapus semua
            </Link>
          </div>
        )}

        {children}
      </div>

      {open && (
        <div className="catalog-drawer">
          <button
            type="button"
            className="catalog-drawer__backdrop"
            aria-label="Tutup filter"
            onClick={() => setOpen(false)}
          />
          <div className="catalog-drawer__panel" role="dialog" aria-modal="true">
            <div className="catalog-drawer__head">
              <strong>Filter produk</strong>
              <button
                type="button"
                className="catalog-drawer__close"
                aria-label="Tutup"
                onClick={() => setOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="catalog-drawer__body">{panel}</div>
            <div className="catalog-drawer__foot">
              <button
                type="button"
                className="btn btn-primary w-full"
                onClick={() => setOpen(false)}
              >
                Lihat {resultCount} produk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
