import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Hero } from "@/components/home/Hero";
import { CategoryStrip, PromoBanners } from "@/components/home/PromoBanners";
import {
  ExperienceBand,
  HomeStory,
  PromiseStrip,
  SoftCta,
} from "@/components/home/HomeExtras";
import { HomeVideo } from "@/components/home/HomeVideo";
import { Reveal } from "@/components/home/Reveal";
import { ProductCard } from "@/components/ProductCard";
import { getCatalogFacets, listProducts } from "@/lib/catalog";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, buildPageMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = {
  ...buildPageMetadata({
    description: SITE_DESCRIPTION,
    path: "/",
    keywords: [
      "45 vape",
      "toko vape online",
      "beli liquid vape",
      "pod system murah",
      "mod vape original",
      SITE_TAGLINE,
    ],
  }),
  title: {
    absolute: `${SITE_NAME} — ${SITE_TAGLINE}`,
  },
};

export default async function HomePage() {
  const [featured, facets] = await Promise.all([
    listProducts({ featured: true, limit: 12 }),
    getCatalogFacets(),
  ]);

  return (
    <div className="home-page">
      <Hero />

      <CategoryStrip
        counts={facets.categories}
        liquidSubs={facets.liquidSubs}
        subs={facets.subs}
      />

      <PromiseStrip />

      <section className="home-featured container-store">
        <Reveal>
          <div className="home-section-head">
            <div>
              <p className="section-kicker">New arrivals</p>
              <h2 className="display section-title">Produk unggulan</h2>
              <p className="section-lead">
                Drop terbaru dan favorit pelanggan — siap masuk keranjang.
              </p>
            </div>
            <Link href="/products" className="home-link home-link--pill">
              View more <ArrowRight size={15} />
            </Link>
          </div>
        </Reveal>
        <div className="product-grid">
          {featured.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>

      <HomeVideo />

      <HomeStory />

      <PromoBanners />
      <ExperienceBand />
      <SoftCta />
    </div>
  );
}
