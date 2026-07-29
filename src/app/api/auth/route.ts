import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  clearGuestCookie,
  createSessionToken,
  ensureGuestId,
  getCurrentUser,
  isProfileComplete,
  profileCompletion,
  setGuestCookie,
  setSessionCookie,
  clearSessionCookie,
} from "@/lib/auth";
import { createGuestId, isValidGuestId, mergeGuestCartToUser } from "@/lib/cart-service";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email().max(100),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
});

function publicUser(user: {
  id: number;
  email: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  role?: "member" | "admin";
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    address: user.address,
    city: user.city,
    province: user.province,
    postalCode: user.postalCode,
    role: user.role || "member",
    profileComplete: isProfileComplete(user),
    profileCompletion: profileCompletion(user),
  };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user: publicUser(user) });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  if (action === "login") {
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, message: "Email/password wajib diisi" }, { status: 400 });
    }
    const email = parsed.data.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(parsed.data.password, user.password))) {
      return NextResponse.json({ ok: false, message: "Email atau password salah" }, { status: 401 });
    }

    const guestId = await ensureGuestId();
    if (isValidGuestId(guestId)) {
      await mergeGuestCartToUser(guestId, user.id);
    }

    const token = await createSessionToken({ userId: user.id, email: user.email });
    const res = NextResponse.json({
      ok: true,
      message: "Login berhasil",
      user: publicUser(user),
    });
    setSessionCookie(res, token);
    clearGuestCookie(res);
    return res;
  }

  if (action === "register") {
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, message: "Data registrasi tidak valid" }, { status: 400 });
    }
    if (parsed.data.password !== parsed.data.confirmPassword) {
      return NextResponse.json({ ok: false, message: "Konfirmasi password tidak cocok" }, { status: 400 });
    }
    const email = parsed.data.email.trim().toLowerCase();
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ ok: false, message: "Email sudah terdaftar" }, { status: 409 });
    }

    const password = await bcrypt.hash(parsed.data.password, 10);
    const user = await prisma.user.create({
      data: { email, password },
    });

    const guestId = await ensureGuestId();
    if (isValidGuestId(guestId)) {
      await mergeGuestCartToUser(guestId, user.id);
    }

    const token = await createSessionToken({ userId: user.id, email: user.email });
    const res = NextResponse.json({
      ok: true,
      message: "Registrasi berhasil",
      user: publicUser(user),
    });
    setSessionCookie(res, token);
    clearGuestCookie(res);
    return res;
  }

  if (action === "logout") {
    const res = NextResponse.json({ ok: true, message: "Logout berhasil" });
    clearSessionCookie(res);
    // Guest baru unik — tidak mewarisi cart user / guest lama
    setGuestCookie(res, createGuestId());
    return res;
  }

  return NextResponse.json({ ok: false, message: "Aksi tidak dikenal" }, { status: 400 });
}
