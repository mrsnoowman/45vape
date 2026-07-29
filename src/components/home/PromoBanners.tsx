import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { BRANDS } from "@/lib/catalog-meta";
import { Reveal } from "@/components/home/Reveal";

const HOME_CATS: {
  key: string;
  label: string;
  href: string;
  img: string;
  count: (
    counts: Record<string, number>,
    liquidSubs: Record<string, number>,
    subs: Record<string, number>,
  ) => number;
}[] = [
  {
    key: "saltnic",
    label: "Saltnic",
    href: "/products?category=liquid&subcategory=saltnic",
    img: "/categories/saltnic.webp",
    count: (_c, liquidSubs) => liquidSubs.saltnic || 0,
  },
  {
    key: "freebase",
    label: "Freebase",
    href: "/products?category=liquid&subcategory=freebase",
    img: "/categories/freebase.webp",
    count: (_c, liquidSubs) => liquidSubs.freebase || 0,
  },
  {
    key: "pod",
    label: "Pod",
    href: "/products?category=pod&subcategory=pod-system",
    img: "/categories/pod.webp",
    count: (_c, _l, subs) => subs["pod-system"] || 0,
  },
  {
    key: "aio",
    label: "AIO",
    href: "/products?category=pod&subcategory=aio",
    img: "/categories/aio.webp",
    count: (_c, _l, subs) => subs.aio || 0,
  },
  {
    key: "mod",
    label: "Mod",
    href: "/products?category=mod",
    img: "/categories/mod.webp",
    count: (c) => c.mod || 0,
  },
  {
    key: "atomizer",
    label: "Atomizer",
    href: "/products?category=atomizer",
    img: "/categories/atomizer.webp",
    count: (c) => c.atomizer || 0,
  },
  {
    key: "accessories",
    label: "Aksesoris",
    href: "/products?category=accessories",
    img: "/categories/accessories.webp",
    count: (c) => c.accessories || 0,
  },
];

export function CategoryStrip({
  counts = {},
  liquidSubs = {},
  subs = {},
}: {
  counts?: Record<string, number>;
  liquidSubs?: Record<string, number>;
  subs?: Record<string, number>;
}) {
  return (
    <section className="home-cats container-store">
      <Reveal>
        <div className="home-section-head home-section-head--compact">
          <div>
            <p className="section-kicker">Jelajahi</p>
            <h2 className="display section-title">Kategori</h2>
          </div>
          <Link href="/products" className="home-link">
            Semua produk <ArrowRight size={15} />
          </Link>
        </div>
      </Reveal>

      <div className="cat-rail">
        <div className="cat-rail__track">
          {HOME_CATS.map((cat) => {
            const n = cat.count(counts, liquidSubs, subs);
            return (
              <Link key={cat.key} href={cat.href} className="cat-rail__card">
                <div className="cat-rail__media">
                  <Image
                    src={cat.img}
                    alt={cat.label}
                    fill
                    className="object-contain p-2.5"
                    sizes="110px"
                  />
                </div>
                <div className="cat-rail__copy">
                  <strong>{cat.label}</strong>
                  <span>
                    {n} produk
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function PromoBanners() {
  return (
    <section className="home-deals container-store">
      <Reveal>
        <div className="home-section-head">
          <div>
            <p className="section-kicker">Collections</p>
            <h2 className="display section-title">Pilih gaya belanjamu</h2>
            <p className="section-lead">
              Dari liquid harian sampai device siap pakai — semua original.
            </p>
          </div>
        </div>
      </Reveal>

      <div className="deal-grid">
        <Reveal className="h-full">
          <Link href="/products?category=liquid" className="deal-card deal-card--liquid">
            <div className="deal-card__copy">
              <p className="deal-card__eyebrow">Liquid</p>
              <h3 className="display">Freebase & saltnic</h3>
              <p>Rasa baru tiap minggu — pilih NIC sesuai gaya hisapmu.</p>
              <span className="deal-card__cta">
                Shop liquid <ArrowUpRight size={15} />
              </span>
            </div>
            <div className="deal-card__media">
              <Image
                src="/products/FOOM BLUEBERRY CHEESE ICE CREAM.png"
                alt="Liquid deals"
                fill
                className="object-contain p-3 md:p-5"
                sizes="(max-width:480px) 100vw, 280px"
              />
            </div>
          </Link>
        </Reveal>

        <Reveal className="h-full" delay={80}>
          <Link href="/products?category=pod" className="deal-card deal-card--device">
            <div className="deal-card__copy">
              <p className="deal-card__eyebrow">Device</p>
              <h3 className="display">Pod system terkini</h3>
              <p>Siap pakai dari unboxing — cocok buat harian.</p>
              <span className="deal-card__cta">
                Shop pod <ArrowUpRight size={15} />
              </span>
            </div>
            <div className="deal-card__media">
              <Image
                src="/products/45 DOTMOD DOTPOD LITE.png"
                alt="Pod deals"
                fill
                className="object-contain p-3 md:p-5"
                sizes="(max-width:480px) 100vw, 280px"
              />
            </div>
          </Link>
        </Reveal>
      </div>

      <Reveal delay={100}>
        <div className="brand-rail">
          <div className="brand-rail__head">
            <p className="section-kicker">Brand spotlight</p>
            <h3 className="display brand-rail__title">Kurasi brand pilihan</h3>
          </div>
          <div className="brand-rail__grid">
            {BRANDS.map((brand) => (
              <Link
                key={brand.slug}
                href={`/products?brand=${brand.slug}`}
                className="brand-card group"
              >
                <div className="brand-card__media">
                  <Image
                    src={brand.image}
                    alt={brand.name}
                    fill
                    className="object-cover transition duration-700 group-hover:scale-[1.04]"
                    sizes="(max-width:768px) 90vw, 30vw"
                  />
                  <span className="brand-card__shade" />
                </div>
                <div className="brand-card__copy">
                  <strong>{brand.name}</strong>
                  <span>{brand.tagline}</span>
                  <em>
                    Lihat koleksi <ArrowRight size={14} />
                  </em>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
