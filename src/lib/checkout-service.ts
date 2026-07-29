import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { isProfileComplete } from "@/lib/auth";
import { getCartView, type CartOwner } from "@/lib/cart-service";
import { pickShippingOption } from "@/lib/pricing";
import type { PaymentMethod } from "@/lib/store";

const ALLOWED_PROOF = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX_PROOF_BYTES = 5 * 1024 * 1024;

export async function savePaymentProof(file: File, orderCode: string) {
  if (!ALLOWED_PROOF.has(file.type)) {
    return { ok: false as const, message: "Bukti harus JPG, PNG, WEBP, atau PDF" };
  }
  if (file.size > MAX_PROOF_BYTES) {
    return { ok: false as const, message: "Ukuran bukti maksimal 5 MB" };
  }

  const ext =
    file.type === "application/pdf"
      ? "pdf"
      : file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpg";

  const dir = path.join(process.cwd(), "public", "uploads", "payment-proofs");
  await mkdir(dir, { recursive: true });
  const filename = `${orderCode.toLowerCase()}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return { ok: true as const, path: `/uploads/payment-proofs/${filename}` };
}

export async function placeOrder(
  userId: number,
  input: {
    note?: string;
    paymentMethod: PaymentMethod;
    paymentProof?: File | null;
    shippingService?: string | null;
    destination?: {
      address?: string | null;
      city?: string | null;
      province?: string | null;
      postalCode?: string | null;
    } | null;
  }
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false as const, message: "User tidak ditemukan", status: 404 };
  if (!isProfileComplete(user)) {
    return {
      ok: false as const,
      message: "Lengkapi data pengiriman di profil sebelum checkout",
      status: 400,
      code: "PROFILE_INCOMPLETE" as const,
    };
  }

  if (input.paymentMethod !== "bank" && input.paymentMethod !== "whatsapp") {
    return { ok: false as const, message: "Metode pembayaran tidak valid", status: 400 };
  }

  if (input.paymentMethod === "bank" && !input.paymentProof) {
    return {
      ok: false as const,
      message: "Unggah bukti transfer sebelum membuat pesanan",
      status: 400,
      code: "PROOF_REQUIRED" as const,
    };
  }

  const destination = {
    address: (input.destination?.address || user.address || "").trim(),
    city: (input.destination?.city || user.city || "").trim(),
    province: (input.destination?.province || user.province || "").trim(),
    postalCode: (input.destination?.postalCode || user.postalCode || "").trim(),
  };

  if (
    destination.address.length < 5 ||
    destination.city.length < 2 ||
    destination.province.length < 2 ||
    destination.postalCode.length < 3
  ) {
    return {
      ok: false as const,
      message: "Lengkapi alamat, kota, provinsi, dan kode pos untuk pengiriman",
      status: 400,
      code: "DESTINATION_INCOMPLETE" as const,
    };
  }

  const owner: CartOwner = { type: "user", userId };
  const cart = await getCartView(owner);
  if (!cart.items.length) {
    return { ok: false as const, message: "Keranjang kosong", status: 400 };
  }

  for (const item of cart.items) {
    if (item.qty > item.stock) {
      return {
        ok: false as const,
        message: `Stok ${item.name} tidak mencukupi`,
        status: 400,
      };
    }
  }

  const { option } = pickShippingOption(destination, input.shippingService);
  const fee = option.fee;
  const total = cart.subtotal + fee;
  const code = `ORD-${Date.now().toString(36).toUpperCase()}`;

  let paymentProofPath: string | null = null;
  if (input.paymentMethod === "bank" && input.paymentProof) {
    const saved = await savePaymentProof(input.paymentProof, code);
    if (!saved.ok) {
      return { ok: false as const, message: saved.message, status: 400 };
    }
    paymentProofPath = saved.path;
  }

  const order = await prisma.$transaction(async (tx) => {
    for (const item of cart.items) {
      const updated = await tx.productVariant.updateMany({
        where: { id: item.variantId, stock: { gte: item.qty } },
        data: { stock: { decrement: item.qty } },
      });
      if (updated.count === 0) {
        throw new Error(`Stok ${item.name} berubah, silakan cek keranjang`);
      }
    }

    const created = await tx.order.create({
      data: {
        code,
        userId,
        status: "pending_payment",
        paymentMethod: input.paymentMethod,
        paymentProof: paymentProofPath,
        subtotal: cart.subtotal,
        shippingFee: fee,
        total,
        shippingName: user.name,
        shippingPhone: user.phone,
        shippingAddress: `${destination.address}, ${destination.city}, ${destination.province} ${destination.postalCode}`,
        shippingService: option.label,
        shippingEta: option.eta,
        note: input.note?.trim() || null,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            name: item.name,
            nic: item.nic,
            image: item.image,
            price: item.price,
            qty: item.qty,
          })),
        },
      },
      include: { items: true },
    });

    await tx.cartItem.deleteMany({ where: { userId } });
    return created;
  });

  const message =
    input.paymentMethod === "bank"
      ? "Pesanan dibuat. Bukti transfer diterima dan menunggu verifikasi."
      : "Pesanan dibuat. Lanjutkan konfirmasi via WhatsApp.";

  return { ok: true as const, order, message };
}

export { getCartView };
