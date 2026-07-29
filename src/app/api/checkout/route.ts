import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isProfileComplete } from "@/lib/auth";
import { getCartView } from "@/lib/cart-service";
import { placeOrder } from "@/lib/checkout-service";
import { pickShippingOption } from "@/lib/pricing";
import { STORE, type PaymentMethod } from "@/lib/store";

function readDestination(
  source: { get: (key: string) => string | null },
  fallback?: {
    address?: string | null;
    city?: string | null;
    province?: string | null;
    postalCode?: string | null;
  }
) {
  const address = (source.get("address") || fallback?.address || "").trim();
  const city = (source.get("city") || fallback?.city || "").trim();
  const province = (source.get("province") || fallback?.province || "").trim();
  const postalCode = (source.get("postalCode") || fallback?.postalCode || "").trim();
  return { address, city, province, postalCode };
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "Login diperlukan", code: "AUTH_REQUIRED" }, { status: 401 });
  }

  const service = req.nextUrl.searchParams.get("service");
  const destination = readDestination(req.nextUrl.searchParams, user);
  const cart = await getCartView({ type: "user", userId: user.id });
  const { quote, option } = pickShippingOption(destination, service);

  return NextResponse.json({
    ok: true,
    user: {
      ...user,
      profileComplete: isProfileComplete(user),
    },
    cart,
    destination,
    shipping: quote,
    shippingService: option.code,
    shippingFee: option.fee,
    shippingEta: option.eta,
    total: cart.subtotal + option.fee,
    paymentInfo: {
      whatsapp: STORE.whatsapp,
      whatsappDisplay: STORE.phoneDisplay,
      bank: STORE.bank,
    },
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "Login diperlukan", code: "AUTH_REQUIRED" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ ok: false, message: "Data checkout tidak valid" }, { status: 400 });
  }

  const paymentMethod = String(form.get("paymentMethod") || "") as PaymentMethod;
  const note = String(form.get("note") || "").slice(0, 500);
  const shippingService = String(form.get("shippingService") || "reg");
  const destination = readDestination({
    get: (key) => {
      const value = form.get(key);
      return typeof value === "string" ? value : null;
    },
  });
  const proof = form.get("paymentProof");
  const paymentProof = proof instanceof File && proof.size > 0 ? proof : null;

  if (paymentMethod !== "bank" && paymentMethod !== "whatsapp") {
    return NextResponse.json({ ok: false, message: "Pilih metode pembayaran" }, { status: 400 });
  }

  if (shippingService !== "reg" && shippingService !== "express") {
    return NextResponse.json({ ok: false, message: "Pilih layanan ongkir" }, { status: 400 });
  }

  try {
    const result = await placeOrder(user.id, {
      note: note || undefined,
      paymentMethod,
      paymentProof,
      shippingService,
      destination,
    });
    if (!result.ok) {
      return NextResponse.json(result, { status: result.status });
    }
    return NextResponse.json({
      ok: true,
      message: result.message,
      order: {
        id: result.order.id,
        code: result.order.code,
        total: result.order.total,
        status: result.order.status,
        paymentMethod: result.order.paymentMethod,
        shippingFee: result.order.shippingFee,
        shippingService: result.order.shippingService,
        shippingEta: result.order.shippingEta,
        items: result.order.items.map((item) => ({
          name: item.name,
          nic: item.nic,
          qty: item.qty,
        })),
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Gagal membuat pesanan";
    return NextResponse.json({ ok: false, message }, { status: 409 });
  }
}
