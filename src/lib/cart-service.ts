import "server-only";

import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { COOKIE_GUEST, readSession } from "@/lib/auth";
import { effectivePrice } from "@/lib/pricing";

export type CartOwner =
  | { type: "user"; userId: number }
  | { type: "guest"; guestId: string };

/** Format guest id: g_ + 32 hex (dari UUID tanpa strip) */
const GUEST_ID_RE = /^g_[a-f0-9]{32}$/i;

export function isValidGuestId(value: string | undefined | null): value is string {
  return Boolean(value && GUEST_ID_RE.test(value));
}

export function createGuestId() {
  return `g_${crypto.randomUUID().replace(/-/g, "")}`;
}

/**
 * Owner keranjang HARUS dari session JWT atau cookie guest httpOnly.
 * Tidak pernah menerima guestId/userId dari body request (cegah spoofing).
 */
export async function resolveCartOwner(guestIdFallback?: string): Promise<CartOwner | null> {
  const session = await readSession();
  if (session?.userId) {
    return { type: "user", userId: session.userId };
  }

  const jar = await cookies();
  const fromCookie = jar.get(COOKIE_GUEST)?.value;
  const candidate = isValidGuestId(fromCookie)
    ? fromCookie
    : isValidGuestId(guestIdFallback)
      ? guestIdFallback
      : null;

  if (!candidate) return null;
  return { type: "guest", guestId: candidate };
}

/** Query ketat: user cart tidak boleh ikut row guest, dan sebaliknya */
function ownerWhere(owner: CartOwner) {
  if (owner.type === "user") {
    return { userId: owner.userId, guestId: null };
  }
  return { guestId: owner.guestId, userId: null };
}

export async function getCartView(owner: CartOwner) {
  const items = await prisma.cartItem.findMany({
    where: ownerWhere(owner),
    select: {
      id: true,
      productId: true,
      variantId: true,
      qty: true,
      product: { select: { slug: true, name: true, brand: true, image: true } },
      variant: {
        select: { nic: true, stock: true, price: true, discountPercent: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const mapped = items.map((item) => {
    const price = effectivePrice(item.variant.price, item.variant.discountPercent);
    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      slug: item.product.slug,
      name: item.product.name,
      brand: item.product.brand,
      image: item.product.image,
      nic: item.variant.nic,
      qty: item.qty,
      stock: item.variant.stock,
      price,
      originalPrice: item.variant.price,
      discountPercent: item.variant.discountPercent,
      lineTotal: price * item.qty,
    };
  });

  const subtotal = mapped.reduce((sum, i) => sum + i.lineTotal, 0);
  const totalItems = mapped.reduce((sum, i) => sum + i.qty, 0);

  return { items: mapped, subtotal, totalItems };
}

export async function addToCart(owner: CartOwner, variantId: number, qty = 1) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });
  if (!variant) return { ok: false as const, message: "Varian tidak ditemukan" };
  if (variant.stock <= 0) return { ok: false as const, message: "Stok habis" };

  const existing = await prisma.cartItem.findFirst({
    where: {
      ...ownerWhere(owner),
      variantId,
    },
  });

  const nextQty = (existing?.qty ?? 0) + qty;
  if (nextQty > variant.stock) {
    return { ok: false as const, message: `Stok tersisa ${variant.stock}` };
  }

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { qty: nextQty },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        userId: owner.type === "user" ? owner.userId : null,
        guestId: owner.type === "guest" ? owner.guestId : null,
        productId: variant.productId,
        variantId: variant.id,
        qty,
      },
    });
  }

  return { ok: true as const, message: "Ditambahkan ke keranjang" };
}

export async function updateCartQty(owner: CartOwner, variantId: number, qty: number) {
  const existing = await prisma.cartItem.findFirst({
    where: { ...ownerWhere(owner), variantId },
    include: { variant: true },
  });
  if (!existing) return { ok: false as const, message: "Item tidak ada di keranjang" };

  // Pastikan row benar-benar milik owner (defense in depth)
  if (owner.type === "user" && existing.userId !== owner.userId) {
    return { ok: false as const, message: "Akses keranjang ditolak" };
  }
  if (owner.type === "guest" && existing.guestId !== owner.guestId) {
    return { ok: false as const, message: "Akses keranjang ditolak" };
  }

  if (qty <= 0) {
    await prisma.cartItem.delete({ where: { id: existing.id } });
    return { ok: true as const, message: "Item dihapus" };
  }

  if (qty > existing.variant.stock) {
    return { ok: false as const, message: `Stok tersisa ${existing.variant.stock}` };
  }

  await prisma.cartItem.update({
    where: { id: existing.id },
    data: { qty },
  });
  return { ok: true as const, message: "Keranjang diperbarui" };
}

export async function removeCartItem(owner: CartOwner, variantId: number) {
  await prisma.cartItem.deleteMany({
    where: { ...ownerWhere(owner), variantId },
  });
  return { ok: true as const, message: "Item dihapus" };
}

export async function clearCart(owner: CartOwner) {
  await prisma.cartItem.deleteMany({ where: ownerWhere(owner) });
}

/** Gabungkan HANYA keranjang guest cookie saat ini ke user yang login */
export async function mergeGuestCartToUser(guestId: string, userId: number) {
  if (!isValidGuestId(guestId) || !userId) return;

  const [guestItems, userItems] = await Promise.all([
    prisma.cartItem.findMany({
      where: { guestId, userId: null },
      include: { variant: { select: { stock: true } } },
    }),
    prisma.cartItem.findMany({
      where: { userId, guestId: null },
      include: { variant: { select: { stock: true } } },
    }),
  ]);
  if (!guestItems.length) return;

  const userByVariant = new Map(userItems.map((row) => [row.variantId, row]));

  await prisma.$transaction(async (tx) => {
    for (const item of guestItems) {
      const existing = userByVariant.get(item.variantId);
      if (existing) {
        const mergedQty = Math.min(existing.qty + item.qty, existing.variant.stock);
        await tx.cartItem.update({
          where: { id: existing.id },
          data: { qty: mergedQty },
        });
        await tx.cartItem.delete({ where: { id: item.id } });
      } else {
        await tx.cartItem.update({
          where: { id: item.id },
          data: { userId, guestId: null },
        });
      }
    }
    await tx.cartItem.deleteMany({ where: { guestId, userId: null } });
  });
}
