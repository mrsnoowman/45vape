import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const COOKIE_SESSION = "45vape_session";
const COOKIE_GUEST = "45vape_guest";

function secretKey() {
  const secret = process.env.AUTH_SECRET || "45vape-local-dev-secret-change-me-32chars";
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  userId: number;
  email: string;
};

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function readSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_SESSION)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const userId = Number(payload.userId);
    const email = String(payload.email || "");
    if (!userId || !email) return null;
    return { userId, email };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await readSession();
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      address: true,
      city: true,
      province: true,
      postalCode: true,
      role: true,
      createdAt: true,
    },
  });
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, status: 401 as const, user: null };
  if (user.role !== "admin") return { ok: false as const, status: 403 as const, user };
  return { ok: true as const, status: 200 as const, user };
}

export function isProfileComplete(user: {
  name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
}) {
  return Boolean(
    user.name?.trim() &&
      user.phone?.trim() &&
      user.address?.trim() &&
      user.city?.trim() &&
      user.province?.trim() &&
      user.postalCode?.trim()
  );
}

export function profileCompletion(user: {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
}) {
  let n = 0;
  if (user.name?.trim()) n += 25;
  if (user.email?.trim()) n += 25;
  if (user.phone?.trim()) n += 25;
  if (user.address?.trim() && user.city?.trim() && user.province?.trim() && user.postalCode?.trim()) {
    n += 25;
  }
  return n;
}

export async function ensureGuestId() {
  const jar = await cookies();
  const current = jar.get(COOKIE_GUEST)?.value;
  // Tolak cookie rusak/kosong supaya device lain tidak bisa “nyangkut” id invalid
  if (current && /^g_[a-f0-9]{32}$/i.test(current)) {
    return current;
  }
  return `g_${crypto.randomUUID().replace(/-/g, "")}`;
}

export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(COOKIE_SESSION, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(COOKIE_SESSION, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function setGuestCookie(res: NextResponse, guestId: string) {
  res.cookies.set(COOKIE_GUEST, guestId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearGuestCookie(res: NextResponse) {
  res.cookies.set(COOKIE_GUEST, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export { COOKIE_GUEST, COOKIE_SESSION };
