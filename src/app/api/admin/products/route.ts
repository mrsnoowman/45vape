import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuard, saveProductImage, slugify } from "@/lib/admin";

function parseVariants(raw: string) {
  try {
    const list = JSON.parse(raw) as {
      id?: number;
      nic?: string | null;
      stock?: number;
      price?: number;
      discountPercent?: number;
    }[];
    if (!Array.isArray(list) || list.length === 0) return null;
    return list.map((v) => ({
      id: v.id,
      nic: v.nic?.trim() || null,
      stock: Math.max(0, Number(v.stock) || 0),
      price: Math.max(0, Math.round(Number(v.price) || 0)),
      discountPercent: Math.min(90, Math.max(0, Math.round(Number(v.discountPercent) || 0))),
    }));
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;

  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  const category = req.nextUrl.searchParams.get("category") || "";
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") || 1) || 1);
  const pageSize = Math.min(50, Math.max(5, Number(req.nextUrl.searchParams.get("pageSize") || 12) || 12));

  const where = {
    ...(category && category !== "all" ? { category } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { brand: { contains: q } },
            { slug: { contains: q } },
          ],
        }
      : {}),
  };

  const [total, products, featuredCount, lowStock, emptyStock] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: { variants: { orderBy: { id: "asc" } } },
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where: { ...where, featured: true } }),
    prisma.product.count({
      where: {
        ...where,
        variants: { some: { stock: { gt: 0, lte: 5 } } },
      },
    }),
    prisma.product.count({
      where: {
        ...where,
        OR: [{ variants: { none: {} } }, { variants: { every: { stock: { lte: 0 } } } }],
      },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return NextResponse.json({
    ok: true,
    page,
    pageSize,
    pageCount,
    total,
    summary: {
      total,
      featured: featuredCount,
      low: lowStock,
      empty: emptyStock,
    },
    products: products.map((p) => {
      const prices = p.variants.map((v) => v.price);
      const discounts = p.variants.map((v) => v.discountPercent);
      return {
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        image: p.image,
        featured: p.featured,
        slug: p.slug,
        minPrice: prices.length ? Math.min(...prices) : 0,
        totalStock: p.variants.reduce((n, v) => n + v.stock, 0),
        maxDiscount: discounts.length ? Math.max(...discounts) : 0,
      };
    }),
  });
}

export async function POST(req: NextRequest) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;

  const form = await req.formData();
  const name = String(form.get("name") || "").trim();
  const brand = String(form.get("brand") || "").trim();
  const brandSlug = slugify(String(form.get("brandSlug") || brand));
  const category = String(form.get("category") || "").trim();
  const subcategory = String(form.get("subcategory") || "").trim() || null;
  const description = String(form.get("description") || "").trim();
  const featured = String(form.get("featured") || "") === "1";
  const slugInput = String(form.get("slug") || "").trim();
  const slug = slugify(slugInput || name);
  const variants = parseVariants(String(form.get("variants") || "[]"));
  const imageFile = form.get("image");

  if (!name || !brand || !category || !description || !slug || !variants) {
    return NextResponse.json(
      { ok: false, message: "Lengkapi nama, brand, kategori, deskripsi, dan minimal 1 varian" },
      { status: 400 },
    );
  }

  if (variants.some((v) => v.price <= 0)) {
    return NextResponse.json({ ok: false, message: "Harga varian harus > 0" }, { status: 400 });
  }

  const exists = await prisma.product.findUnique({ where: { slug } });
  if (exists) {
    return NextResponse.json({ ok: false, message: "Slug produk sudah dipakai" }, { status: 409 });
  }

  let image = String(form.get("imagePath") || "").trim();
  if (imageFile instanceof File && imageFile.size > 0) {
    const saved = await saveProductImage(imageFile, slug);
    if (!saved.ok) {
      return NextResponse.json({ ok: false, message: saved.message }, { status: 400 });
    }
    image = saved.path;
  }
  if (!image) {
    return NextResponse.json({ ok: false, message: "Unggah gambar produk" }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      brand,
      brandSlug,
      category,
      subcategory,
      description,
      image,
      featured,
      variants: {
        create: variants.map((v) => ({
          nic: v.nic,
          stock: v.stock,
          price: v.price,
          discountPercent: v.discountPercent,
        })),
      },
    },
    include: { variants: true },
  });

  return NextResponse.json({ ok: true, product });
}
