"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Plus, Trash2, Upload } from "lucide-react";
import { CATEGORIES, categorySubs } from "@/lib/catalog-meta";
import { slugify } from "@/lib/slug";
import { AdminSuggestInput } from "@/components/admin/AdminSuggestInput";

export type VariantDraft = {
  id?: number;
  nic: string;
  stock: number;
  price: number;
  discountPercent: number;
};

export type ProductDraft = {
  id?: number;
  name: string;
  slug: string;
  brand: string;
  brandSlug: string;
  category: string;
  subcategory: string;
  description: string;
  featured: boolean;
  image: string;
  variants: VariantDraft[];
};

const emptyVariant = (): VariantDraft => ({
  nic: "",
  stock: 0,
  price: 0,
  discountPercent: 0,
});

type Props = {
  mode: "create" | "edit";
  initial?: ProductDraft;
};

export function AdminProductForm({ mode, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<ProductDraft>(
    initial || {
      name: "",
      slug: "",
      brand: "",
      brandSlug: "",
      category: "liquid",
      subcategory: "saltnic",
      description: "",
      featured: false,
      image: "",
      variants: [emptyVariant()],
    },
  );
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initial?.image || null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const categoryOptions = CATEGORIES.filter((c) => c.slug !== "all");
  const subs = categorySubs(form.category);
  const lockedSlug = mode === "edit" ? initial?.slug || form.slug : slugify(form.name);
  const lockedBrandSlug = slugify(form.brand);

  const imageLabel = useMemo(() => {
    if (!file) return "";
    return `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB`;
  }, [file]);

  const onPickImage = (next: File | null) => {
    setFile(next);
    if (!next) {
      setPreview(form.image || null);
      return;
    }
    const url = URL.createObjectURL(next);
    setPreview(url);
  };

  const updateVariant = (index: number, patch: Partial<VariantDraft>) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const body = new FormData();
    body.set("name", form.name);
    body.set("slug", lockedSlug || slugify(form.name));
    body.set("brand", form.brand);
    body.set("brandSlug", lockedBrandSlug || slugify(form.brand));
    body.set("category", form.category);
    body.set("subcategory", form.subcategory);
    body.set("description", form.description);
    body.set("featured", form.featured ? "1" : "0");
    body.set(
      "variants",
      JSON.stringify(
        form.variants.map((v) => ({
          id: v.id,
          nic: v.nic,
          stock: v.stock,
          price: v.price,
          discountPercent: v.discountPercent,
        })),
      ),
    );
    if (form.image) body.set("imagePath", form.image);
    if (file) body.append("image", file, file.name);

    const url = mode === "create" ? "/api/admin/products" : `/api/admin/products/${form.id}`;
    const res = await fetch(url, {
      method: mode === "create" ? "POST" : "PUT",
      body,
    });
    const data = await res.json();
    setSaving(false);

    if (!data.ok) {
      setError(data.message || "Gagal menyimpan produk");
      return;
    }

    router.push("/admin/products");
    router.refresh();
  };

  return (
    <form className="admin-form" onSubmit={onSubmit}>
      <div className="admin-form__grid">
        <section className="admin-panel">
          <div className="admin-panel__head">
            <div>
              <h2>Informasi produk</h2>
              <p>Detail dasar yang tampil di katalog.</p>
            </div>
          </div>

          <div className="admin-fields">
            <AdminSuggestInput
              label="Nama produk *"
              field="name"
              value={form.name}
              required
              placeholder="Contoh: Lunar Ice Mocha"
              onChange={(name) => {
                setForm((prev) => ({
                  ...prev,
                  name,
                  slug: mode === "create" ? slugify(name) : prev.slug,
                }));
              }}
              onPick={(item) => {
                setForm((prev) => ({
                  ...prev,
                  name: item.value,
                  slug: mode === "create" ? slugify(item.value) : prev.slug,
                  brand: item.brand || prev.brand,
                  brandSlug: item.brand ? slugify(item.brand) : prev.brandSlug,
                  category: item.category || prev.category,
                  subcategory:
                    item.subcategory ||
                    categorySubs(item.category || prev.category)[0]?.slug ||
                    prev.subcategory,
                }));
              }}
            />

            <label>
              <span>Slug URL</span>
              <input
                className="admin-input is-locked"
                value={lockedSlug}
                readOnly
                disabled
                tabIndex={-1}
                aria-describedby="slug-hint"
              />
              <small id="slug-hint" className="admin-field-hint">
                Otomatis dari nama produk
                {mode === "edit" ? " · dikunci agar link toko tidak berubah" : ""}
              </small>
            </label>

            <div className="admin-fields__row">
              <AdminSuggestInput
                label="Brand *"
                field="brand"
                value={form.brand}
                required
                placeholder="Nama brand"
                hint={
                  <small className="admin-field-hint is-spacer" aria-hidden>
                    &nbsp;
                  </small>
                }
                onChange={(brand) => {
                  setForm((prev) => ({
                    ...prev,
                    brand,
                    brandSlug: slugify(brand),
                  }));
                }}
              />
              <label>
                <span>Brand slug</span>
                <input
                  className="admin-input is-locked"
                  value={lockedBrandSlug}
                  readOnly
                  disabled
                  tabIndex={-1}
                  aria-describedby="brand-slug-hint"
                />
                <small id="brand-slug-hint" className="admin-field-hint">
                  Otomatis dari nama brand
                </small>
              </label>
            </div>

            <div className="admin-fields__row">
              <label>
                <span>Kategori *</span>
                <select
                  className="admin-input"
                  value={form.category}
                  onChange={(e) => {
                    const category = e.target.value;
                    const nextSubs = categorySubs(category);
                    setForm((prev) => ({
                      ...prev,
                      category,
                      subcategory: nextSubs[0]?.slug || "",
                    }));
                  }}
                >
                  {categoryOptions.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <small className="admin-field-hint is-spacer" aria-hidden>
                  &nbsp;
                </small>
              </label>
              <label>
                <span>Subkategori</span>
                {subs.length > 0 ? (
                  <select
                    className="admin-input"
                    value={form.subcategory}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, subcategory: e.target.value }))
                    }
                  >
                    <option value="">Pilih tipe</option>
                    {subs.map((s) => (
                      <option key={s.slug} value={s.slug}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="admin-input"
                    placeholder="Opsional"
                    value={form.subcategory}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, subcategory: e.target.value }))
                    }
                  />
                )}
                <small className="admin-field-hint is-spacer" aria-hidden>
                  &nbsp;
                </small>
              </label>
            </div>

            <label>
              <span>Deskripsi *</span>
              <textarea
                className="admin-input admin-input--area"
                rows={8}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder={`Contoh format:

READY STOCK
.
BANANALICIOUS SALTNIC
*100% Authentic By Emkay
.
Flavour : Banana Cream Strawberry
Nicotine : 35MG
Volume : 30ML
PG/VG : 50/50`}
                required
              />
              <small className="admin-field-hint">
                Tip: tulis label lalu titik dua (Flavour :, Nicotine :) agar tampil tebal & rapi di toko.
              </small>
            </label>

            <label className="admin-check">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm((prev) => ({ ...prev, featured: e.target.checked }))}
              />
              <span>Tampilkan sebagai produk unggulan</span>
            </label>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel__head">
            <div>
              <h2>Gambar produk *</h2>
              <p>JPG, PNG, WEBP, atau GIF · maks 5 MB.</p>
            </div>
          </div>

          <div className="admin-upload">
            <input
              id="product-image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
            />
            {preview ? (
              <div className="admin-upload__preview">
                <div className="admin-upload__thumb">
                  <Image
                    src={preview}
                    alt="Preview"
                    fill
                    unoptimized={preview.startsWith("blob:")}
                    className="object-contain p-2"
                  />
                </div>
                <div className="admin-upload__meta">
                  <strong>{file ? file.name : "Gambar tersimpan"}</strong>
                  <span>{file ? imageLabel : form.image}</span>
                  <label htmlFor="product-image" className="admin-btn admin-btn--sm">
                    <ImagePlus size={13} />
                    Ganti gambar
                  </label>
                </div>
              </div>
            ) : (
              <label htmlFor="product-image" className="admin-upload__drop">
                <span className="admin-upload__icon">
                  <Upload size={18} strokeWidth={1.8} />
                </span>
                <strong>Unggah gambar produk</strong>
                <span>Klik atau pilih file dari perangkat</span>
              </label>
            )}
          </div>
        </section>
      </div>

      <section className="admin-panel">
        <div className="admin-panel__head">
          <div>
            <h2>Varian & Diimage.pngskon</h2>
            <p>Atur NIC, stok, harga, dan diskon tiap varian.</p>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn--sm"
            onClick={() =>
              setForm((prev) => ({ ...prev, variants: [...prev.variants, emptyVariant()] }))
            }
          >
            <Plus size={14} />
            Tambah varian
          </button>
        </div>

        <div className="admin-variant-list">
          {form.variants.map((v, index) => (
            <div key={v.id ?? `new-${index}`} className="admin-variant-row">
              <div className="admin-variant-row__index">{index + 1}</div>
              <label>
                <span>NIC</span>
                <input
                  className="admin-input"
                  placeholder="15mg / —"
                  value={v.nic}
                  onChange={(e) => updateVariant(index, { nic: e.target.value })}
                />
              </label>
              <label>
                <span>Stok</span>
                <input
                  className="admin-input"
                  type="number"
                  min={0}
                  value={v.stock}
                  onChange={(e) => updateVariant(index, { stock: Number(e.target.value) })}
                />
              </label>
              <label>
                <span>Harga (Rp)</span>
                <input
                  className="admin-input"
                  type="number"
                  min={0}
                  value={v.price}
                  onChange={(e) => updateVariant(index, { price: Number(e.target.value) })}
                  required
                />
              </label>
              <label>
                <span>Diskon %</span>
                <input
                  className="admin-input"
                  type="number"
                  min={0}
                  max={90}
                  value={v.discountPercent}
                  onChange={(e) =>
                    updateVariant(index, { discountPercent: Number(e.target.value) })
                  }
                />
              </label>
              <button
                type="button"
                className="admin-variant-row__remove"
                disabled={form.variants.length <= 1}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    variants: prev.variants.filter((_, i) => i !== index),
                  }))
                }
                aria-label="Hapus varian"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {error ? <div className="admin-form__error">{error}</div> : null}

      <div className="admin-form__actions">
        <Link href="/admin/products" className="admin-btn">
          Batal
        </Link>
        <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
          {saving ? "Menyimpan…" : mode === "create" ? "Tambah produk" : "Simpan perubahan"}
        </button>
      </div>
    </form>
  );
}
