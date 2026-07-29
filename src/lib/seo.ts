import type { Metadata } from "next";

/** Production domain — set NEXT_PUBLIC_SITE_URL di .env (wajib untuk SEO/canonical). */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "https://45vape.com"
).replace(/\/$/, "");

export const SITE_NAME = "45 Vape";
export const SITE_LEGAL_NAME = "45 Vape Store";
export const SITE_TAGLINE = "Toko Vape Online Terpercaya";

export const SITE_DESCRIPTION =
  "Belanja liquid, pod, mod, atomizer, dan aksesoris vape original di 45 Vape. Harga bersaing, stok update, pengiriman cepat ke seluruh Indonesia.";

export const SITE_KEYWORDS = [
  "toko vape online",
  "beli liquid vape",
  "saltnic",
  "freebase",
  "pod system",
  "mod vape",
  "atomizer",
  "coil vape",
  "aksesoris vape",
  "45 vape",
  "vape murah original",
  "vape Indonesia",
];

export const SITE_PHONE = "+6281387884545";
export const SITE_PHONE_DISPLAY = "+62 813-8788-4545";
export const SITE_WHATSAPP = "6281387884545";
export const SITE_LOCALE = "id_ID";

/** Default social / OG image (1200×630 ideal). */
export const SITE_OG_IMAGE = "/banners/banner2.png";
export const SITE_LOGO = "/brand/IMG_3820.PNG";
export const SITE_FAVICON = "/brand/IMG_3820.PNG";

export function absoluteUrl(path = "/") {
  if (!path || path === "/") return SITE_URL;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function truncateMeta(text: string, max = 155) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

export function buildPageMetadata({
  title,
  description,
  path = "/",
  image,
  noIndex = false,
  keywords,
}: {
  title?: string;
  description?: string;
  path?: string;
  image?: string | null;
  noIndex?: boolean;
  keywords?: string[];
}): Metadata {
  const desc = truncateMeta(description || SITE_DESCRIPTION);
  const url = absoluteUrl(path);
  const ogImage = absoluteUrl(image || SITE_OG_IMAGE);
  const fullTitle = title ? `${title} · ${SITE_NAME}` : undefined;

  return {
    title: title || undefined,
    description: desc,
    keywords: keywords?.length ? keywords : undefined,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: SITE_LOCALE,
      url,
      siteName: SITE_NAME,
      title: fullTitle || `${SITE_NAME} — ${SITE_TAGLINE}`,
      description: desc,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title || SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle || `${SITE_NAME} — ${SITE_TAGLINE}`,
      description: desc,
      images: [ogImage],
    },
    robots: noIndex
      ? { index: false, follow: false, nocache: true }
      : { index: true, follow: true },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    legalName: SITE_LEGAL_NAME,
    url: SITE_URL,
    logo: absoluteUrl(SITE_LOGO),
    image: absoluteUrl(SITE_OG_IMAGE),
    description: SITE_DESCRIPTION,
    telephone: SITE_PHONE,
    sameAs: [`https://wa.me/${SITE_WHATSAPP}`],
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: SITE_PHONE,
        contactType: "customer service",
        availableLanguage: ["Indonesian", "English"],
        areaServed: "ID",
      },
    ],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: "id-ID",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/products?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function storeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: SITE_NAME,
    url: SITE_URL,
    image: absoluteUrl(SITE_OG_IMAGE),
    telephone: SITE_PHONE,
    priceRange: "Rp",
    address: {
      "@type": "PostalAddress",
      addressCountry: "ID",
    },
    areaServed: {
      "@type": "Country",
      name: "Indonesia",
    },
  };
}

export function productJsonLd(product: {
  name: string;
  slug: string;
  description: string;
  brand: string;
  image: string;
  price: number;
  stock: number;
  category?: string;
}) {
  const url = absoluteUrl(`/product/${product.slug}`);
  const image = absoluteUrl(product.image);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: truncateMeta(product.description, 300),
    image: [image],
    sku: product.slug,
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    category: product.category,
    url,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "IDR",
      price: product.price,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: SITE_NAME,
      },
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
