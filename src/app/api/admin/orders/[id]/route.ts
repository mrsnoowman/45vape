import { NextRequest, NextResponse } from "next/server";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { adminGuard } from "@/lib/admin";

const STATUSES = new Set<string>(Object.values(OrderStatus));

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;
  const id = Number((await ctx.params).id);

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          province: true,
          postalCode: true,
        },
      },
      items: true,
    },
  });

  if (!order) {
    return NextResponse.json({ ok: false, message: "Pesanan tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    order: {
      ...order,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    },
  });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;
  const id = Number((await ctx.params).id);
  const body = await req.json().catch(() => ({}));
  const status = String(body.status || "");

  if (!STATUSES.has(status)) {
    return NextResponse.json({ ok: false, message: "Status tidak valid" }, { status: 400 });
  }

  try {
    const order = await prisma.order.update({
      where: { id },
      data: { status: status as OrderStatus },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: true,
      },
    });
    return NextResponse.json({
      ok: true,
      order: {
        ...order,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ ok: false, message: "Pesanan tidak ditemukan" }, { status: 404 });
  }
}
