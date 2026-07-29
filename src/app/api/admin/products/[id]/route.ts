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
      id: v.id ? Number(v.id) : undefined,
      nic: v.nic?.trim() || null,
      stock: Math.max(0, Number(v.stock) || 0),
      price: Math.max(0, Math.round(Number(v.price) || 0)),
      discountPercent: Math.min(90, Math.max(0, Math.round(Number(v.discountPercent) || 0))),
    }));
  } catch {
    return null;
  }
}

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;
  const id = Number((await ctx.params).id);
  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: { orderBy: { id: "asc" } } },
  });
  if (!product) {
    return NextResponse.json({ ok: false, message: "Produk tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, product });
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;
  const id = Number((await ctx.params).id);

  const existing = await prisma.product.findUnique({
    where: { id },
    include: { variants: true },
  });
  if (!existing) {
    return NextResponse.json({ ok: false, message: "Produk tidak ditemukan" }, { status: 404 });
  }

  const form = await req.formData();
  const name = String(form.get("name") || "").trim();
  const brand = String(form.get("brand") || "").trim();
  const brandSlug = slugify(String(form.get("brandSlug") || brand));
  const category = String(form.get("category") || "").trim();
  const subcategory = String(form.get("subcategory") || "").trim() || null;
  const description = String(form.get("description") || "").trim();
  const featured = String(form.get("featured") || "") === "1";
  const slug = slugify(String(form.get("slug") || name));
  const variants = parseVariants(String(form.get("variants") || "[]"));
  const imageFile = form.get("image");

  if (!name || !brand || !category || !description || !slug || !variants) {
    return NextResponse.json({ ok: false, message: "Data produk tidak lengkap" }, { status: 400 });
  }

  const clash = await prisma.product.findFirst({
    where: { slug, NOT: { id } },
  });
  if (clash) {
    return NextResponse.json({ ok: false, message: "Slug sudah dipakai produk lain" }, { status: 409 });
  }

  let image = existing.image;
  if (imageFile instanceof File && imageFile.size > 0) {
    const saved = await saveProductImage(imageFile, slug);
    if (!saved.ok) {
      return NextResponse.json({ ok: false, message: saved.message }, { status: 400 });
    }
    image = saved.path;
  }

  const keepIds = variants.map((v) => v.id).filter(Boolean) as number[];
  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        name,
        slug,
        brand,
        brandSlug,
        category,
        subcategory,
        description,
        featured,
        image,
      },
    });

    await tx.productVariant.deleteMany({
      where: { productId: id, id: { notIn: keepIds.length ? keepIds : [-1] } },
    });

    for (const v of variants) {
      if (v.id && existing.variants.some((x) => x.id === v.id)) {
        await tx.productVariant.update({
          where: { id: v.id },
          data: {
            nic: v.nic,
            stock: v.stock,
            price: v.price,
            discountPercent: v.discountPercent,
          },
        });
      } else {
        await tx.productVariant.create({
          data: {
            productId: id,
            nic: v.nic,
            stock: v.stock,
            price: v.price,
            discountPercent: v.discountPercent,
          },
        });
      }
    }
  });

  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: { orderBy: { id: "asc" } } },
  });

  return NextResponse.json({ ok: true, product });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;
  const id = Number((await ctx.params).id);

  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Produk tidak bisa dihapus (mungkin sudah ada di pesanan)" },
      { status: 400 },
    );
  }
}
