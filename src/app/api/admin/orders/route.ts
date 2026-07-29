import { NextRequest, NextResponse } from "next/server";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { adminGuard } from "@/lib/admin";

const STATUSES = new Set<string>(Object.values(OrderStatus));

export async function GET(req: NextRequest) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;

  const status = req.nextUrl.searchParams.get("status") || "";
  const q = (req.nextUrl.searchParams.get("q") || "").trim();

  const orders = await prisma.order.findMany({
    where: {
      ...(status && STATUSES.has(status) ? { status: status as OrderStatus } : {}),
      ...(q
        ? {
            OR: [
              { code: { contains: q } },
              { shippingName: { contains: q } },
              { shippingPhone: { contains: q } },
              { user: { email: { contains: q } } },
              { user: { name: { contains: q } } },
            ],
          }
        : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      items: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({
    ok: true,
    orders: orders.map((o) => ({
      id: o.id,
      code: o.code,
      status: o.status,
      paymentMethod: o.paymentMethod,
      paymentProof: o.paymentProof,
      subtotal: o.subtotal,
      shippingFee: o.shippingFee,
      shippingService: o.shippingService,
      shippingEta: o.shippingEta,
      total: o.total,
      shippingName: o.shippingName,
      shippingPhone: o.shippingPhone,
      shippingAddress: o.shippingAddress,
      note: o.note,
      createdAt: o.createdAt.toISOString(),
      customer: {
        id: o.user.id,
        name: o.user.name,
        email: o.user.email,
        phone: o.user.phone,
      },
      items: o.items,
      itemCount: o.items.reduce((n, i) => n + i.qty, 0),
    })),
  });
}
