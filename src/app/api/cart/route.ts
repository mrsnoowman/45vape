import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ensureGuestId, setGuestCookie, readSession } from "@/lib/auth";
import {
  addToCart,
  createGuestId,
  getCartView,
  isValidGuestId,
  removeCartItem,
  resolveCartOwner,
  updateCartQty,
  type CartOwner,
} from "@/lib/cart-service";

/**
 * Isolasi keranjang:
 * - Guest: cookie httpOnly `45vape_guest` unik per browser/device
 * - User: JWT session `45vape_session` → userId
 * - guestId/userId TIDAK pernah diambil dari body request
 */
async function withOwnerResponse(
  handler: (owner: CartOwner, guestId: string | null) => Promise<NextResponse>
) {
  const session = await readSession();

  if (session?.userId) {
    const owner: CartOwner = { type: "user", userId: session.userId };
    return handler(owner, null);
  }

  let guestId = await ensureGuestId();
  if (!isValidGuestId(guestId)) {
    guestId = createGuestId();
  }

  const owner: CartOwner = { type: "guest", guestId };
  const res = await handler(owner, guestId);
  setGuestCookie(res, guestId);
  return res;
}

export async function GET() {
  return withOwnerResponse(async (owner) => {
    const cart = await getCartView(owner);
    return NextResponse.json({
      ...cart,
      scope: owner.type,
    });
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  // Abaikan field guestId/userId jika dikirim klien (anti-spoof)
  const parsed = z
    .object({
      variantId: z.number().int().positive(),
      qty: z.number().int().positive().optional(),
    })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Data item tidak valid" }, { status: 400 });
  }

  return withOwnerResponse(async (owner) => {
    const result = await addToCart(owner, parsed.data.variantId, parsed.data.qty ?? 1);
    const cart = await getCartView(owner);
    return NextResponse.json(
      { ...result, cart, scope: owner.type },
      { status: result.ok ? 200 : 400 }
    );
  });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = z
    .object({
      variantId: z.number().int().positive(),
      qty: z.number().int(),
    })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Data tidak valid" }, { status: 400 });
  }

  return withOwnerResponse(async (owner) => {
    const result = await updateCartQty(owner, parsed.data.variantId, parsed.data.qty);
    const cart = await getCartView(owner);
    return NextResponse.json(
      { ...result, cart, scope: owner.type },
      { status: result.ok ? 200 : 400 }
    );
  });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = z.object({ variantId: z.number().int().positive() }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Data tidak valid" }, { status: 400 });
  }

  return withOwnerResponse(async (owner) => {
    const result = await removeCartItem(owner, parsed.data.variantId);
    const cart = await getCartView(owner);
    return NextResponse.json({ ...result, cart, scope: owner.type });
  });
}
