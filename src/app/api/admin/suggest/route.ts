import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuard } from "@/lib/admin";

/** Autocomplete nama / brand dari produk yang sudah ada. */
export async function GET(req: NextRequest) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;

  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  const field = (req.nextUrl.searchParams.get("field") || "name").toLowerCase();
  if (q.length < 1) return NextResponse.json({ items: [] });

  if (field === "brand") {
    const rows = await prisma.product.findMany({
      where: { brand: { contains: q } },
      select: { brand: true },
      distinct: ["brand"],
      take: 12,
      orderBy: { brand: "asc" },
    });
    return NextResponse.json({
      items: rows.map((r) => ({ value: r.brand, hint: "Brand" })),
    });
  }

  const rows = await prisma.product.findMany({
    where: {
      OR: [{ name: { contains: q } }, { brand: { contains: q } }],
    },
    select: { name: true, brand: true, category: true, subcategory: true },
    take: 12,
    orderBy: { updatedAt: "desc" },
  });

  const seen = new Set<string>();
  const items: { value: string; hint: string; brand: string; category: string; subcategory: string | null }[] = [];
  for (const r of rows) {
    const key = r.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      value: r.name,
      hint: r.brand,
      brand: r.brand,
      category: r.category,
      subcategory: r.subcategory,
    });
  }

  return NextResponse.json({ items });
}
