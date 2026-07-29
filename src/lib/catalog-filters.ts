import { categorySubs } from "@/lib/catalog-meta";

export type CatalogQuery = {
  category?: string;
  brand?: string;
  subcategory?: string;
  q?: string;
  sort?: string;
  min?: string;
  max?: string;
  stock?: string;
  sale?: string;
};

export const SORT_OPTIONS = [
  { value: "featured", label: "Unggulan" },
  { value: "newest", label: "Terbaru" },
  { value: "name", label: "Nama A–Z" },
  { value: "price-asc", label: "Harga terendah" },
  { value: "price-desc", label: "Harga tertinggi" },
] as const;

export const PRICE_PRESETS = [
  { label: "< 100rb", min: "", max: "100000" },
  { label: "100–300rb", min: "100000", max: "300000" },
  { label: "300–500rb", min: "300000", max: "500000" },
  { label: "500rb+", min: "500000", max: "" },
] as const;

/** @deprecated use categorySubs from catalog-meta */
export const LIQUID_SUBS = [
  { slug: "", label: "Semua liquid" },
  ...categorySubs("liquid").map((s) => ({ slug: s.slug, label: s.label })),
];

/** @deprecated use categorySubs from catalog-meta */
export const ACCESSORY_SUBS = [
  { slug: "", label: "Semua aksesoris" },
  ...categorySubs("accessories").map((s) => ({ slug: s.slug, label: s.label })),
];

export function productsHref(query: CatalogQuery) {
  const params = new URLSearchParams();
  if (query.category && query.category !== "all") params.set("category", query.category);
  if (query.brand) params.set("brand", query.brand);
  if (query.subcategory) params.set("subcategory", query.subcategory);
  if (query.q) params.set("q", query.q);
  if (query.sort && query.sort !== "featured") params.set("sort", query.sort);
  if (query.min) params.set("min", query.min);
  if (query.max) params.set("max", query.max);
  if (query.stock === "1") params.set("stock", "1");
  if (query.sale === "1") params.set("sale", "1");
  const qs = params.toString();
  return qs ? `/products?${qs}` : "/products";
}

export function countActiveFilters(query: CatalogQuery) {
  let n = 0;
  if (query.category && query.category !== "all") n += 1;
  if (query.brand) n += 1;
  if (query.subcategory) n += 1;
  if (query.q) n += 1;
  if (query.min || query.max) n += 1;
  if (query.stock === "1") n += 1;
  if (query.sale === "1") n += 1;
  return n;
}
