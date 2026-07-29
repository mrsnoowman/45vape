import type { ProductCategory } from "@/lib/types";

export type CategorySub = {
  slug: string;
  label: string;
};

export type NavCategory = {
  slug: ProductCategory;
  label: string;
  href: string;
  description: string;
  subs: CategorySub[];
};

export const NAV_CATEGORIES: NavCategory[] = [
  {
    slug: "liquid",
    label: "Liquid",
    href: "/products?category=liquid",
    description: "Saltnic & freebase",
    subs: [
      { slug: "saltnic", label: "Saltnic" },
      { slug: "freebase", label: "Freebase" },
    ],
  },
  {
    slug: "pod",
    label: "Pod",
    href: "/products?category=pod",
    description: "Pod system & AIO",
    subs: [
      { slug: "pod-system", label: "Pod System" },
      { slug: "aio", label: "AIO" },
    ],
  },
  {
    slug: "mod",
    label: "Mod",
    href: "/products?category=mod",
    description: "Electrical & mechanical",
    subs: [
      { slug: "electrical-mod", label: "Electrical Mod" },
      { slug: "mechanical-mod", label: "Mechanical Mod" },
    ],
  },
  {
    slug: "atomizer",
    label: "Atomizer",
    href: "/products?category=atomizer",
    description: "Coil, RDA & tank",
    subs: [
      { slug: "cartridge", label: "Cartridge" },
      { slug: "rda", label: "RDA" },
      { slug: "rba", label: "RBA" },
      { slug: "coil", label: "Coil" },
      { slug: "coil-prebuild", label: "Coil Prebuild" },
      { slug: "rta", label: "RTA" },
      { slug: "rbta", label: "RBTA" },
    ],
  },
  {
    slug: "accessories",
    label: "Aksesoris",
    href: "/products?category=accessories",
    description: "Battery, cotton & tools",
    subs: [
      { slug: "driptip", label: "Driptip" },
      { slug: "battery", label: "Battery" },
      { slug: "charger-battery", label: "Charger Battery" },
      { slug: "cotton", label: "Cotton" },
      { slug: "tool-kit", label: "Tool Kit" },
      { slug: "other", label: "Other" },
    ],
  },
];

export const CATEGORIES: {
  slug: ProductCategory | "all";
  label: string;
  href: string;
  description: string;
}[] = [
  { slug: "all", label: "Semua", href: "/products", description: "Katalog lengkap" },
  ...NAV_CATEGORIES.map((c) => ({
    slug: c.slug,
    label: c.label,
    href: c.href,
    description: c.description,
  })),
];

export const BRANDS = [
  {
    slug: "idj",
    name: "Indonesia Dream Juice",
    tagline: "Koleksi liquid premium — jelajahi varian favorit.",
    image: "/banners/2.jpg",
  },
  {
    slug: "foom",
    name: "FOOM",
    tagline: "Flavor bold & konsisten.",
    image: "/banners/3.jpg",
  },
  {
    slug: "juicenation",
    name: "Juice Nation",
    tagline: "Fruity & creamy — pilihan lengkap.",
    image: "/banners/4.jpg",
  },
] as const;

export const HERO_BANNERS = [
  { src: "/banners/banner2.png", alt: "Promo 45 Vape" },
  { src: "/banners/2.jpg", alt: "Indonesia Dream Juice" },
  { src: "/banners/3.jpg", alt: "FOOM" },
  { src: "/banners/4.jpg", alt: "Juice Nation" },
];

export function categoryLabel(category: string) {
  return CATEGORIES.find((c) => c.slug === category)?.label ?? category;
}

export function subcategoryLabel(category: string | undefined, subcategory: string) {
  if (!subcategory) return subcategory;
  const nav = NAV_CATEGORIES.find((c) => c.slug === category);
  const hit = nav?.subs.find((s) => s.slug === subcategory);
  if (hit) return hit.label;
  for (const cat of NAV_CATEGORIES) {
    const found = cat.subs.find((s) => s.slug === subcategory);
    if (found) return found.label;
  }
  return subcategory;
}

export function categorySubs(category: string | undefined) {
  if (!category) return [];
  return NAV_CATEGORIES.find((c) => c.slug === category)?.subs ?? [];
}
