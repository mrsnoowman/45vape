"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Package, Pencil, Plus, Search } from "lucide-react";
import { PageLoading } from "@/components/PageLoading";
import { CATEGORIES, categoryLabel } from "@/lib/catalog-meta";
import { formatIDR } from "@/lib/format";

type ProductRow = {
  id: number;
  name: string;
  brand: string;
  category: string;
  image: string;
  featured: boolean;
  totalStock: number;
  minPrice: number;
  maxDiscount: number;
  slug: string;
};

type Summary = {
  total: number;
  featured: number;
  low: number;
  empty: number;
};

const PAGE_SIZE = 12;

function stockTone(stock: number) {
  if (stock <= 0) return "is-danger";
  if (stock <= 5) return "is-warn";
  return "is-ok";
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, featured: 0, low: 0, empty: 0 });
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (query: string, cat: string, pageNum: number) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (cat !== "all") params.set("category", cat);
    params.set("page", String(pageNum));
    params.set("pageSize", String(PAGE_SIZE));
    const res = await fetch(`/api/admin/products?${params}`, { cache: "no-store" });
    const data = await res.json();
    if (data.ok) {
      setProducts(data.products);
      setSummary(data.summary || { total: data.total || 0, featured: 0, low: 0, empty: 0 });
      setTotal(data.total || 0);
      setPageCount(data.pageCount || 1);
      setPage(data.page || pageNum);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load(q, category, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, category]);

  const applySearch = () => {
    setPage(1);
    void load(q, category, 1);
  };

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="admin-products">
      <div className="admin-page-bar">
        <p className="admin-page-bar__desc">Kelola produk, stok, harga, dan diskon.</p>
        <div className="admin-page-bar__actions">
          <Link href="/admin/products/new" className="admin-btn admin-btn--primary">
            <Plus size={15} strokeWidth={2} />
            Tambah produk
          </Link>
        </div>
      </div>

      <div className="admin-products__summary">
        <div className="admin-mini-stat">
          <em>Total</em>
          <strong>{summary.total}</strong>
        </div>
        <div className="admin-mini-stat">
          <em>Featured</em>
          <strong>{summary.featured}</strong>
        </div>
        <div className="admin-mini-stat is-warn">
          <em>Stok menipis</em>
          <strong>{summary.low}</strong>
        </div>
        <div className="admin-mini-stat is-danger">
          <em>Habis</em>
          <strong>{summary.empty}</strong>
        </div>
      </div>

      <div className="admin-filters">
        <form
          className="admin-search"
          onSubmit={(e) => {
            e.preventDefault();
            applySearch();
          }}
        >
          <Search size={15} strokeWidth={1.9} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama, brand, atau slug…"
          />
        </form>
        <select
          className="admin-select"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
        >
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
        <button type="button" className="admin-btn" onClick={applySearch}>
          Cari
        </button>
      </div>

      {loading ? (
        <PageLoading label="Memuat produk" variant="orders" />
      ) : (
        <section className="admin-panel">
          <div className="admin-panel__head">
            <div>
              <h2>Daftar produk</h2>
              <p>
                Menampilkan {from}–{to} dari {total} produk
                {category !== "all" ? ` · ${categoryLabel(category)}` : ""}
                {q.trim() ? ` · “${q.trim()}”` : ""}
              </p>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="admin-empty">
              <Package size={22} strokeWidth={1.7} />
              <strong>Tidak ada produk</strong>
              <p>Ubah filter atau tambah produk baru ke katalog.</p>
              <Link href="/admin/products/new" className="admin-btn admin-btn--primary">
                <Plus size={14} />
                Tambah produk
              </Link>
            </div>
          ) : (
            <>
              <div className="admin-table-wrap">
                <table className="admin-table admin-table--products">
                  <thead>
                    <tr>
                      <th>Produk</th>
                      <th>Kategori</th>
                      <th>Stok</th>
                      <th>Harga</th>
                      <th>Diskon</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <div className="admin-product-cell">
                            <span className="admin-product-cell__thumb">
                              <Image src={p.image} alt="" fill className="object-contain p-1" />
                            </span>
                            <span className="admin-product-cell__meta">
                              <strong>{p.name}</strong>
                              <em>
                                {p.brand}
                                {p.featured ? (
                                  <span className="admin-pill">Featured</span>
                                ) : null}
                              </em>
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="admin-cat">{categoryLabel(p.category)}</span>
                        </td>
                        <td>
                          <span className={`admin-stock ${stockTone(p.totalStock)}`}>
                            {p.totalStock}
                          </span>
                        </td>
                        <td>
                          <span className="admin-cell-strong">{formatIDR(p.minPrice)}</span>
                        </td>
                        <td>
                          {p.maxDiscount > 0 ? (
                            <span className="admin-discount">-{p.maxDiscount}%</span>
                          ) : (
                            <span className="admin-cell-muted">—</span>
                          )}
                        </td>
                        <td>
                          <Link
                            href={`/admin/products/${p.id}`}
                            className="admin-btn admin-btn--sm"
                          >
                            <Pencil size={13} strokeWidth={1.9} />
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="admin-pager">
                <p className="admin-pager__meta">
                  Halaman <strong>{page}</strong> dari <strong>{pageCount}</strong>
                </p>
                <div className="admin-pager__controls">
                  <button
                    type="button"
                    className="admin-btn admin-btn--sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft size={14} />
                    Prev
                  </button>
                  <div className="admin-pager__pages">
                    {Array.from({ length: pageCount }, (_, i) => i + 1)
                      .filter((n) => {
                        if (pageCount <= 7) return true;
                        if (n === 1 || n === pageCount) return true;
                        return Math.abs(n - page) <= 1;
                      })
                      .reduce<(number | "…")[]>((acc, n, idx, arr) => {
                        if (idx > 0 && typeof arr[idx - 1] === "number" && n - (arr[idx - 1] as number) > 1) {
                          acc.push("…");
                        }
                        acc.push(n);
                        return acc;
                      }, [])
                      .map((item, idx) =>
                        item === "…" ? (
                          <span key={`e-${idx}`} className="admin-pager__ellipsis">
                            …
                          </span>
                        ) : (
                          <button
                            key={item}
                            type="button"
                            className={`admin-pager__num${page === item ? " is-active" : ""}`}
                            onClick={() => setPage(item)}
                          >
                            {item}
                          </button>
                        ),
                      )}
                  </div>
                  <button
                    type="button"
                    className="admin-btn admin-btn--sm"
                    disabled={page >= pageCount}
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  >
                    Next
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
