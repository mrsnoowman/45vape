import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, isProfileComplete, profileCompletion } from "@/lib/auth";
import { prisma } from "@/lib/db";

const profileSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().min(8).max(30),
  address: z.string().min(5),
  city: z.string().min(2).max(80),
  province: z.string().min(2).max(80),
  postalCode: z.string().min(3).max(12),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    ok: true,
    user: {
      ...user,
      profileComplete: isProfileComplete(user),
      profileCompletion: profileCompletion(user),
    },
  });
}

export async function PUT(req: NextRequest) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Lengkapi semua field pengiriman dengan benar" },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id: current.id },
    data: parsed.data,
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
    },
  });

  return NextResponse.json({
    ok: true,
    message: "Profil disimpan",
    user: {
      ...user,
      profileComplete: isProfileComplete(user),
      profileCompletion: profileCompletion(user),
    },
  });
}
