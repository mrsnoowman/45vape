"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { BadgePercent, Search } from "lucide-react";
import { PageLoading } from "@/components/PageLoading";
import { formatIDR } from "@/lib/format";
import { effectivePrice } from "@/lib/pricing";

type DiscountRow = {
  variantId: number;
  productId: number;
  productName: string;
  brand: string;
  image: string;
  nic: string | null;
  price: number;
  stock: number;
  discountPercent: number;
};

export default function AdminDiscountsPage() {
  const [items, setItems] = useState<DiscountRow[]>([]);
  const [draft, setDraft] = useState<Record<number, number>>({});
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/discounts", { cache: "no-store" });
      const data = await res.json();
      if (data.ok) {
        setItems(data.items);
        setDraft(
          Object.fromEntries(
            data.items.map((i: DiscountRow) => [i.variantId, i.discountPercent]),
          ),
        );
      }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (i) =>
        i.productName.toLowerCase().includes(term) ||
        i.brand.toLowerCase().includes(term) ||
        (i.nic || "").toLowerCase().includes(term),
    );
  }, [items, q]);

  const dirty = items.filter((i) => (draft[i.variantId] ?? 0) !== i.discountPercent);
  const withDiscount = items.filter((i) => (draft[i.variantId] ?? i.discountPercent) > 0).length;

  const save = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    const res = await fetch("/api/admin/discounts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        updates: dirty.map((i) => ({
          variantId: i.variantId,
          discountPercent: draft[i.variantId] ?? 0,
        })),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!data.ok) {
      setError(data.message || "Gagal menyimpan");
      return;
    }
    setItems((prev) =>
      prev.map((i) => ({
        ...i,
        discountPercent: draft[i.variantId] ?? i.discountPercent,
      })),
    );
    setMessage(`${dirty.length} diskon berhasil diperbarui`);
  };

  if (loading) {
    return <PageLoading label="Memuat diskon" variant="orders" />;
  }

  return (
    <div className="admin-list-page">
      <div className="admin-page-bar">
        <p className="admin-page-bar__desc">
          Atur persen diskon per varian untuk harga di toko.
        </p>
        <div className="admin-page-bar__actions">
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            disabled={saving || dirty.length === 0}
            onClick={() => void save()}
          >
            {saving ? "Menyimpan…" : `Simpan (${dirty.length})`}
          </button>
        </div>
      </div>

      <div className="admin-products__summary">
        <div className="admin-mini-stat">
          <em>Varian</em>
          <strong>{items.length}</strong>
        </div>
        <div className="admin-mini-stat">
          <em>Ada diskon</em>
          <strong>{withDiscount}</strong>
        </div>
        <div className="admin-mini-stat is-warn">
          <em>Belum disimpan</em>
          <strong>{dirty.length}</strong>
        </div>
      </div>

      <div className="admin-filters">
        <form
          className="admin-search"
          onSubmit={(e) => e.preventDefault()}
        >
          <Search size={15} strokeWidth={1.9} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari produk, brand, atau NIC…"
          />
        </form>
      </div>

      {message ? <div className="admin-form__success">{message}</div> : null}
      {error ? <div className="admin-form__error">{error}</div> : null}

      <section className="admin-panel">
        <div className="admin-panel__head">
          <div>
            <h2>Daftar diskon</h2>
            <p>
              {filtered.length} varian
              {q.trim() ? ` · “${q.trim()}”` : ""}
            </p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="admin-empty">
            <BadgePercent size={22} strokeWidth={1.7} />
            <strong>Tidak ada data diskon</strong>
            <p>Ubah kata kunci pencarian atau tambah produk terlebih dahulu.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Varian</th>
                  <th>Harga</th>
                  <th>Diskon %</th>
                  <th>Harga efektif</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const disc = draft[item.variantId] ?? 0;
                  const changed = disc !== item.discountPercent;
                  return (
                    <tr key={item.variantId} className={changed ? "is-dirty" : ""}>
                      <td>
                        <div className="admin-product-cell">
                          <span className="admin-product-cell__thumb">
                            <Image src={item.image} alt="" fill className="object-contain p-1" />
                          </span>
                          <span className="admin-product-cell__meta">
                            <strong>{item.productName}</strong>
                            <em>{item.brand}</em>
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="admin-cat">{item.nic || "—"}</span>
                      </td>
                      <td>
                        <span className="admin-cell-muted">{formatIDR(item.price)}</span>
                      </td>
                      <td>
                        <input
                          className="admin-input admin-discount-input"
                          type="number"
                          min={0}
                          max={90}
                          value={disc}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              [item.variantId]: Number(e.target.value),
                            }))
                          }
                        />
                      </td>
                      <td>
                        <span className="admin-cell-strong">
                          {formatIDR(effectivePrice(item.price, disc))}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
