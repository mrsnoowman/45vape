import type { MetadataRoute } from "next";
import { listProductSlugs } from "@/lib/catalog";
import { BRANDS, NAV_CATEGORIES } from "@/lib/catalog-meta";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/products`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${SITE_URL}/kontak`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = NAV_CATEGORIES.flatMap((cat) => {
    const base = {
      url: `${SITE_URL}/products?category=${cat.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.85,
    };
    const subs = cat.subs.map((sub) => ({
      url: `${SITE_URL}/products?category=${cat.slug}&subcategory=${sub.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    }));
    return [base, ...subs];
  });

  const brandRoutes: MetadataRoute.Sitemap = BRANDS.map((brand) => ({
    url: `${SITE_URL}/products?brand=${brand.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const slugs = await listProductSlugs();
    productRoutes = slugs.map((slug) => ({
      url: `${SITE_URL}/product/${slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {
    productRoutes = [];
  }

  return [...staticRoutes, ...categoryRoutes, ...brandRoutes, ...productRoutes];
}
