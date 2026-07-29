import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuard } from "@/lib/admin";

export async function GET() {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;

  const [products, members, orders, revenue, pending, lowStock] = await Promise.all([
    prisma.product.count(),
    prisma.user.count({ where: { role: "member" } }),
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { not: "cancelled" } },
    }),
    prisma.order.count({ where: { status: "pending_payment" } }),
    prisma.productVariant.count({ where: { stock: { lte: 5 } } }),
  ]);

  const recentOrders = await prisma.order.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: true,
    },
  });

  const byStatus = await prisma.order.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  return NextResponse.json({
    ok: true,
    stats: {
      products,
      members,
      orders,
      revenue: revenue._sum.total || 0,
      pending,
      lowStock,
    },
    statusCounts: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      code: o.code,
      status: o.status,
      total: o.total,
      paymentMethod: o.paymentMethod,
      createdAt: o.createdAt.toISOString(),
      customer: o.user.name || o.user.email,
      itemCount: o.items.reduce((n, i) => n + i.qty, 0),
    })),
  });
}
