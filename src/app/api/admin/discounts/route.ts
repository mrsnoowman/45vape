import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuard } from "@/lib/admin";

/** List / update variant discounts across catalog */
export async function GET() {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;

  const products = await prisma.product.findMany({
    include: { variants: { orderBy: { id: "asc" } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    ok: true,
    items: products.flatMap((p) =>
      p.variants.map((v) => ({
        variantId: v.id,
        productId: p.id,
        productName: p.name,
        brand: p.brand,
        image: p.image,
        nic: v.nic,
        price: v.price,
        stock: v.stock,
        discountPercent: v.discountPercent,
      })),
    ),
  });
}

export async function PATCH(req: NextRequest) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => ({}));
  const updates = Array.isArray(body.updates) ? body.updates : [];

  if (!updates.length) {
    return NextResponse.json({ ok: false, message: "Tidak ada update" }, { status: 400 });
  }

  await prisma.$transaction(
    updates.map((u: { variantId: number; discountPercent: number }) =>
      prisma.productVariant.update({
        where: { id: Number(u.variantId) },
        data: {
          discountPercent: Math.min(90, Math.max(0, Math.round(Number(u.discountPercent) || 0))),
        },
      }),
    ),
  );

  return NextResponse.json({ ok: true });
}
