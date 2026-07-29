import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminProductForm } from "@/components/admin/AdminProductForm";

export default function AdminNewProductPage() {
  return (
    <div className="admin-product-page">
      <div className="admin-page-bar">
        <Link href="/admin/products" className="admin-back">
          <ArrowLeft size={14} strokeWidth={2} />
          Produk
        </Link>
      </div>
      <AdminProductForm mode="create" />
    </div>
  );
}
