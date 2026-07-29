export function effectivePrice(price: number, discountPercent: number) {
  if (!discountPercent || discountPercent <= 0) return price;
  return Math.round((price * (100 - Math.min(100, discountPercent))) / 100);
}

export { shippingFee, quoteShipping, pickShippingOption } from "@/lib/shipping";
export type { ShippingOption, ShippingQuote, ShippingService } from "@/lib/shipping";
