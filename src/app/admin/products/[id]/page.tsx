"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminProductForm, type ProductDraft } from "@/components/admin/AdminProductForm";
import { PageLoading } from "@/components/PageLoading";

export default function AdminEditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<ProductDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/admin/products/${params.id}`, { cache: "no-store" });
      const data = await res.json();
      if (data.ok) {
        const p = data.product;
        setProduct({
          id: p.id,
          name: p.name,
          slug: p.slug,
          brand: p.brand,
          brandSlug: p.brandSlug,
          category: p.category,
          subcategory: p.subcategory || "",
          description: p.description,
          featured: p.featured,
          image: p.image,
          variants: p.variants.map(
            (v: {
              id: number;
              nic: string | null;
              stock: number;
              price: number;
              discountPercent: number;
            }) => ({
              id: v.id,
              nic: v.nic || "",
              stock: v.stock,
              price: v.price,
              discountPercent: v.discountPercent,
            }),
          ),
        });
      }
      setLoading(false);
    })();
  }, [params.id]);

  if (loading || !product) {
    return <PageLoading label="Memuat produk" variant="orders" />;
  }

  return (
    <div className="admin-product-page">
      <div className="admin-page-bar">
        <Link href="/admin/products" className="admin-back">
          <ArrowLeft size={14} strokeWidth={2} />
          Produk
        </Link>
        <p className="admin-page-bar__meta">{product.name}</p>
        <div className="admin-page-bar__actions">
          <button
            type="button"
            className="admin-btn admin-btn--danger"
            disabled={deleting}
            onClick={async () => {
              if (!confirm("Hapus produk ini?")) return;
              setDeleting(true);
              const res = await fetch(`/api/admin/products/${product.id}`, {
                method: "DELETE",
              });
              const data = await res.json();
              setDeleting(false);
              if (data.ok) {
                router.push("/admin/products");
                router.refresh();
              } else {
                alert(data.message || "Gagal menghapus");
              }
            }}
          >
            {deleting ? "Menghapus…" : "Hapus"}
          </button>
        </div>
      </div>
      <AdminProductForm mode="edit" initial={product} />
    </div>
  );
}
