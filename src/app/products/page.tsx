import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { CatalogShell } from "@/components/CatalogFilters";
import { ProductCard } from "@/components/ProductCard";
import { getCatalogFacets, listProductSlugs, listProducts } from "@/lib/catalog";
import { BRANDS, categoryLabel, subcategoryLabel } from "@/lib/catalog-meta";
import type { CatalogQuery } from "@/lib/catalog-filters";
import { countActiveFilters, productsHref } from "@/lib/catalog-filters";

export const revalidate = 60;

const PAGE_SIZE = 24;

export const metadata = {
  title: "Produk",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    brand?: string;
    subcategory?: string;
    q?: string;
    sort?: string;
    min?: string;
    max?: string;
    stock?: string;
    sale?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const query: CatalogQuery = {
    category: params.category,
    brand: params.brand,
    subcategory: params.subcategory,
    q: params.q,
    sort: params.sort,
    min: params.min,
    max: params.max,
    stock: params.stock,
    sale: params.sale,
  };

  const [all, facets] = await Promise.all([
    listProducts({
      category: params.category,
      brand: params.brand,
      subcategory: params.subcategory,
      q: params.q,
      sort: params.sort,
      minPrice: params.min ? Number(params.min) : null,
      maxPrice: params.max ? Number(params.max) : null,
      inStock: params.stock,
      onSale: params.sale,
    }),
    getCatalogFacets(),
  ]);

  const totalResults = all.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const list = all.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const activeFilters = countActiveFilters(query);
  const brandName =
    params.brand &&
    (facets.brands.find((b) => b.slug === params.brand)?.name ||
      BRANDS.find((b) => b.slug === params.brand)?.name ||
      params.brand);

  const subLabel =
    params.subcategory && subcategoryLabel(params.category, params.subcategory);

  const title = params.q
    ? `Hasil: “${params.q}”`
    : brandName
      ? String(brandName)
      : subLabel
        ? String(subLabel)
        : params.category
          ? categoryLabel(params.category)
          : "Semua Produk";

  const lead = params.q
    ? `${totalResults} produk cocok dengan pencarianmu.`
    : subLabel && params.category
      ? `${totalResults} produk ${categoryLabel(params.category).toLowerCase()} · ${subLabel}.`
      : activeFilters > 0
        ? `${totalResults} produk sesuai filter yang dipilih.`
        : `${facets.total} produk siap dikirim — saring kategori, brand, harga, atau stok.`;

  const pageHref = (p: number) =>
    productsHref({
      ...query,
      ...(p > 1 ? { page: String(p) } : {}),
    });

  return (
    <div className="container-store catalog-page">
      <nav className="catalog-page__crumb" aria-label="Breadcrumb">
        <Link href="/">Beranda</Link>
        <span>/</span>
        <span>Produk</span>
      </nav>

      <header className="catalog-head">
        <div className="catalog-head__top">
          <div>
            <p className="section-kicker">Katalog</p>
            <h1 className="display catalog-head__title">{title}</h1>
            <p className="catalog-head__lead">{lead}</p>
          </div>
          <div className="catalog-head__stats">
            <div className="catalog-stat-chip">
              <strong>{totalResults}</strong>
              <span>Hasil</span>
            </div>
            <div className="catalog-stat-chip">
              <strong>{facets.brands.length}</strong>
              <span>Brand</span>
            </div>
            <div className="catalog-stat-chip">
              <strong>{activeFilters}</strong>
              <span>Filter</span>
            </div>
          </div>
        </div>
      </header>

      <CatalogShell
        query={query}
        brands={facets.brands}
        categoryCounts={facets.categories}
        totalAll={facets.total}
        resultCount={totalResults}
      >
        {list.length === 0 ? (
          <div className="catalog-empty">
            <div className="catalog-empty__icon" aria-hidden>
              <PackageSearch size={22} />
            </div>
            <h2 className="display">Produk tidak ditemukan</h2>
            <p>Coba ubah filter, hapus kata kunci, atau reset ke katalog penuh.</p>
            <div className="catalog-empty__actions">
              <Link href="/products" className="btn btn-primary">
                Reset filter
              </Link>
              <Link href="/" className="btn btn-ghost">
                Ke beranda
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="product-grid catalog-grid">
              {list.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
            {totalPages > 1 ? (
              <nav className="catalog-pager" aria-label="Halaman produk">
                {safePage > 1 ? (
                  <Link href={pageHref(safePage - 1)} className="btn btn-ghost">
                    Sebelumnya
                  </Link>
                ) : (
                  <span />
                )}
                <span className="catalog-pager__status">
                  Halaman {safePage} / {totalPages}
                </span>
                {safePage < totalPages ? (
                  <Link href={pageHref(safePage + 1)} className="btn btn-ghost">
                    Selanjutnya
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            ) : null}
          </>
        )}
      </CatalogShell>
    </div>
  );
}
