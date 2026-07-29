export const STORE = {
  name: "45 Vape",
  phoneDisplay: "+62 813-8788-4545",
  /** Digits only, country code without + */
  whatsapp: "6281387884545",
  bank: {
    banks: "BCA / Mandiri / BRI",
    accountNumber: "1234567890",
    accountName: "PT. 45Vape Indonesia",
  },
} as const;

export type PaymentMethod = "bank" | "whatsapp";

export function whatsappUrl(text?: string) {
  const base = `https://wa.me/${STORE.whatsapp}`;
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function orderWhatsAppMessage(input: {
  code: string;
  total: number;
  paymentMethod: PaymentMethod;
  items: { name: string; nic: string | null; qty: number }[];
  shippingService?: string | null;
  shippingEta?: string | null;
  shippingFee?: number | null;
}) {
  const lines = [
    `Halo ${STORE.name}, saya ingin ${input.paymentMethod === "bank" ? "konfirmasi pembayaran" : "order via WhatsApp"}.`,
    "",
    `Kode pesanan: ${input.code}`,
    `Total: Rp ${input.total.toLocaleString("id-ID")}`,
  ];

  if (input.shippingService || input.shippingFee != null) {
    lines.push(
      `Ongkir: ${input.shippingService || "—"}${input.shippingFee != null ? ` · Rp ${input.shippingFee.toLocaleString("id-ID")}` : ""}${input.shippingEta ? ` (${input.shippingEta})` : ""}`
    );
  }

  lines.push("", "Item:", ...input.items.map(
    (item) => `- ${item.name}${item.nic ? ` (NIC ${item.nic})` : ""} × ${item.qty}`
  ));

  if (input.paymentMethod === "bank") {
    lines.push("", "Bukti transfer sudah saya unggah / saya kirim di chat ini.");
  } else {
    lines.push("", "Mohon dibantu proses order ini via WhatsApp.");
  }

  return lines.join("\n");
}
