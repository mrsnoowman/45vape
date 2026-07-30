import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import ProductDetailClient from "@/components/ProductDetailClient";
import { getProductBySlug, getRelatedProducts, listProductSlugs } from "@/lib/catalog";
import { categoryLabel } from "@/lib/catalog-meta";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  buildPageMetadata,
  productJsonLd,
  truncateMeta,
} from "@/lib/seo";

export async function generateStaticParams() {
  try {
    const slugs = await listProductSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return buildPageMetadata({
      title: "Produk tidak ditemukan",
      path: `/product/${slug}`,
      noIndex: true,
    });
  }

  const cat = categoryLabel(product.category);
  const desc = truncateMeta(
    `${product.name} — ${product.brand}. ${product.description}`.trim(),
  );

  return {
    ...buildPageMetadata({
      title: `${product.name} | ${product.brand}`,
      description: desc,
      path: `/product/${product.slug}`,
      image: product.image,
      keywords: [
        product.name,
        product.brand,
        cat,
        "beli vape",
        "toko vape online",
        "45 vape",
      ],
    }),
    openGraph: {
      type: "website",
      title: `${product.name} · 45 Vape`,
      description: desc,
      url: absoluteUrl(`/product/${product.slug}`),
      images: [
        {
          url: absoluteUrl(product.image),
          alt: product.name,
        },
      ],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const related = await getRelatedProducts(product.category, product.id, 4);

  const jsonLd = [
    productJsonLd({
      name: product.name,
      slug: product.slug,
      description: product.description,
      brand: product.brand,
      image: product.image,
      price: product.minPrice,
      stock: product.totalStock,
      category: categoryLabel(product.category),
    }),
    breadcrumbJsonLd([
      { name: "Beranda", path: "/" },
      { name: "Produk", path: "/products" },
      {
        name: categoryLabel(product.category),
        path: `/products?category=${product.category}`,
      },
      { name: product.name, path: `/product/${product.slug}` },
    ]),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <ProductDetailClient product={product} related={related} />
    </>
  );
}
