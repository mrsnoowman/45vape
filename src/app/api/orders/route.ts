import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    ok: true,
    orders: orders.map((order) => ({
      id: order.id,
      code: order.code,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentProof: order.paymentProof,
      total: order.total,
      shippingFee: order.shippingFee,
      shippingService: order.shippingService,
      shippingEta: order.shippingEta,
      shippingAddress: order.shippingAddress,
      createdAt: order.createdAt,
      items: order.items,
    })),
  });
}
