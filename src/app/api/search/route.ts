import { NextRequest, NextResponse } from "next/server";
import { listProducts } from "@/lib/catalog";
import { categoryLabel } from "@/lib/catalog-meta";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (q.length < 1) {
    return NextResponse.json({ ok: true, items: [] });
  }

  const products = await listProducts({ q, limit: 8 });
  const items = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    category: categoryLabel(p.category),
    image: p.image,
    minPrice: p.minPrice,
    hasDiscount: p.hasDiscount,
  }));

  return NextResponse.json({
    ok: true,
    total: items.length,
    items,
  });
}
