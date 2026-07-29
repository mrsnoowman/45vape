import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuard } from "@/lib/admin";

export async function GET(req: NextRequest) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;

  const q = (req.nextUrl.searchParams.get("q") || "").trim();

  const members = await prisma.user.findMany({
    where: {
      role: "member",
      ...(q
        ? {
            OR: [
              { email: { contains: q } },
              { name: { contains: q } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      address: true,
      city: true,
      province: true,
      postalCode: true,
      createdAt: true,
      _count: { select: { orders: true } },
      orders: {
        select: { total: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return NextResponse.json({
    ok: true,
    members: members.map((m) => ({
      id: m.id,
      email: m.email,
      name: m.name,
      phone: m.phone,
      address: m.address,
      city: m.city,
      province: m.province,
      postalCode: m.postalCode,
      createdAt: m.createdAt.toISOString(),
      orderCount: m._count.orders,
      spent: m.orders
        .filter((o) => o.status !== "cancelled")
        .reduce((n, o) => n + o.total, 0),
    })),
  });
}
