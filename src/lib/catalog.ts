import "server-only";

import { prisma } from "@/lib/db";
import { effectivePrice } from "@/lib/pricing";
import type { ProductDTO } from "@/lib/types";

export type { ProductDTO };

export type ProductSort = "featured" | "name" | "price-asc" | "price-desc" | "newest";

export type ProductListOpts = {
  category?: string | null;
  brand?: string | null;
  subcategory?: string | null;
  q?: string | null;
  featured?: boolean;
  sort?: ProductSort | string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  inStock?: boolean | string | null;
  onSale?: boolean | string | null;
};

function buildGallery(image: string) {
  // Hanya gambar milik produk ini — jangan isi filler kategori/brand lain
  const src = (image || "").trim();
  return src ? [src] : [];
}

function mapProduct(p: {
  id: number;
  slug: string;
  name: string;
  brand: string;
  brandSlug: string;
  category: string;
  subcategory: string | null;
  description: string;
  image: string;
  featured: boolean;
  createdAt?: Date;
  variants: {
    id: number;
    nic: string | null;
    stock: number;
    price: number;
    discountPercent: number;
  }[];
}): ProductDTO {
  const variants = p.variants.map((v) => ({
    ...v,
    effectivePrice: effectivePrice(v.price, v.discountPercent),
  }));
  const prices = variants.map((v) => v.effectivePrice);
  return {
    ...p,
    gallery: buildGallery(p.image),
    variants,
    minPrice: prices.length ? Math.min(...prices) : 0,
    hasDiscount: variants.some((v) => v.discountPercent > 0),
    totalStock: variants.reduce((n, v) => n + v.stock, 0),
  };
}

function truthy(v: boolean | string | null | undefined) {
  if (v === true) return true;
  if (typeof v === "string") return v === "1" || v === "true" || v === "yes";
  return false;
}

function parseMoney(v: number | string | null | undefined) {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^\d]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export async function listProducts(opts: ProductListOpts) {
  const products = await prisma.product.findMany({
    where: {
      ...(opts.category && opts.category !== "all" ? { category: opts.category } : {}),
      ...(opts.brand ? { brandSlug: opts.brand } : {}),
      ...(opts.subcategory ? { subcategory: opts.subcategory } : {}),
      ...(opts.featured ? { featured: true } : {}),
      ...(opts.q
        ? {
            OR: [
              { name: { contains: opts.q } },
              { brand: { contains: opts.q } },
              { category: { contains: opts.q } },
            ],
          }
        : {}),
    },
    include: { variants: { orderBy: { id: "asc" } } },
    orderBy: [{ featured: "desc" }, { name: "asc" }],
  });

  let list = products.map(mapProduct);

  const minPrice = parseMoney(opts.minPrice as number | string | null);
  const maxPrice = parseMoney(opts.maxPrice as number | string | null);
  const inStock = truthy(opts.inStock);
  const onSale = truthy(opts.onSale);

  if (minPrice != null) list = list.filter((p) => p.minPrice >= minPrice);
  if (maxPrice != null) list = list.filter((p) => p.minPrice <= maxPrice);
  if (inStock) list = list.filter((p) => p.totalStock > 0);
  if (onSale) list = list.filter((p) => p.hasDiscount);

  const sort = (opts.sort || "featured") as ProductSort;
  list = [...list].sort((a, b) => {
    switch (sort) {
      case "name":
        return a.name.localeCompare(b.name, "id");
      case "price-asc":
        return a.minPrice - b.minPrice;
      case "price-desc":
        return b.minPrice - a.minPrice;
      case "newest":
        return b.id - a.id;
      case "featured":
      default:
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return a.name.localeCompare(b.name, "id");
    }
  });

  return list;
}

export async function getCatalogFacets() {
  const [brands, categories, liquidSubs, allSubs, total] = await Promise.all([
    prisma.product.groupBy({
      by: ["brandSlug", "brand"],
      _count: { _all: true },
      orderBy: { brand: "asc" },
    }),
    prisma.product.groupBy({
      by: ["category"],
      _count: { _all: true },
    }),
    prisma.product.groupBy({
      by: ["subcategory"],
      where: { category: "liquid", subcategory: { not: null } },
      _count: { _all: true },
    }),
    prisma.product.groupBy({
      by: ["subcategory"],
      where: { subcategory: { not: null } },
      _count: { _all: true },
    }),
    prisma.product.count(),
  ]);

  const liquidSubsMap = Object.fromEntries(
    liquidSubs
      .filter((s) => s.subcategory)
      .map((s) => [String(s.subcategory), s._count._all]),
  );

  return {
    total,
    brands: brands.map((b) => ({
      slug: b.brandSlug,
      name: b.brand,
      count: b._count._all,
    })),
    categories: Object.fromEntries(categories.map((c) => [c.category, c._count._all])),
    liquidSubs: liquidSubsMap,
    subs: Object.fromEntries(
      allSubs
        .filter((s) => s.subcategory)
        .map((s) => [String(s.subcategory), s._count._all]),
    ),
  };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { variants: { orderBy: { id: "asc" } } },
  });
  return product ? mapProduct(product) : null;
}

export async function getRelatedProducts(category: string, excludeId: number, take = 4) {
  const products = await prisma.product.findMany({
    where: { category, id: { not: excludeId } },
    include: { variants: true },
    take,
  });
  return products.map(mapProduct);
}

export async function countByCategory() {
  const groups = await prisma.product.groupBy({
    by: ["category"],
    _count: { _all: true },
  });
  return Object.fromEntries(groups.map((g) => [g.category, g._count._all]));
}

export { effectivePrice };
