"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

const SLIDES = [
  {
    src: "/banners/banner2.png",
    alt: "Promo 45 Vape",
    kicker: "Promo minggu ini",
    title: "Flavor baru,\nrasa lebih dingin",
    text: "Liquid & device pilihan — siap kirim hari ini.",
    href: "/products",
    product: "/products/FOOM BLUEBERRY CHEESE ICE CREAM.png",
  },
  {
    src: "/banners/2.jpg",
    alt: "Indonesia Dream Juice",
    kicker: "Indonesia Dream Juice",
    title: "Liquid lokal\npremium",
    text: "Varian favorit dengan kualitas konsisten.",
    href: "/products?brand=idj",
    product: "/products/45 REX57 BLUEBERRY MILK TOAST.png",
  },
  {
    src: "/banners/3.jpg",
    alt: "FOOM",
    kicker: "FOOM Collection",
    title: "Bold flavor,\nsiap tiap hari",
    text: "Pilihan rasa yang paling sering dicari.",
    href: "/products?brand=foom",
    product: "/products/FOOM BLUEBERRY CHEESE ICE CREAM.png",
  },
  {
    src: "/banners/4.jpg",
    alt: "Juice Nation",
    kicker: "Juice Nation",
    title: "Fruity &\ncreamy picks",
    text: "Temukan rasa favoritmu di satu katalog.",
    href: "/products?brand=juicenation",
    product: "/products/ATOMIX LUXURY.png",
  },
];

export function Hero() {
  const [index, setIndex] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
      setTick((t) => t + 1);
    }, 6000);
    return () => window.clearInterval(id);
  }, []);

  const go = (next: number) => {
    setIndex(((next % SLIDES.length) + SLIDES.length) % SLIDES.length);
    setTick((t) => t + 1);
  };

  const slide = SLIDES[index] ?? SLIDES[0];

  return (
    <section className="home-hero container-store">
      <div className="home-hero__frame">
        {SLIDES.map((item, i) => (
          <div
            key={item.src}
            className={`home-hero__slide ${i === index ? "is-active" : ""}`}
            aria-hidden={i !== index}
          >
            <Image
              src={item.src}
              alt={item.alt}
              fill
              priority={i === 0}
              sizes="(max-width:1480px) 100vw, 1480px"
              className="object-cover"
            />
          </div>
        ))}

        <div className="home-hero__veil" aria-hidden />

        <div className="home-hero__body">
          <div className="home-hero__copy" key={`c-${index}-${tick}`}>
            <p className="home-hero__brand">45 VAPE</p>
            <span className="home-hero__rule" aria-hidden />
            <p className="home-hero__kicker">{slide.kicker}</p>
            <h1 className="display home-hero__title">
              {slide.title.split("\n").map((line) => (
                <span key={line}>
                  {line}
                  <br />
                </span>
              ))}
            </h1>
            <p className="home-hero__text">{slide.text}</p>

            <div className="home-hero__actions">
              <Link href={slide.href} className="btn btn-primary home-hero__cta">
                Belanja sekarang
                <ArrowRight size={15} />
              </Link>
              <Link href="/products?sale=1" className="home-hero__link">
                Lihat diskon
              </Link>
            </div>
          </div>

          <div className="home-hero__visual" key={`v-${index}-${tick}`} aria-hidden>
            <div className="home-hero__glow" />
            <div className="home-hero__product">
              <Image
                src={slide.product}
                alt=""
                fill
                sizes="(max-width:960px) 50vw, 380px"
                className="object-contain"
                priority={index === 0}
              />
            </div>
          </div>
        </div>

        <div className="home-hero__footer">
          <div className="home-hero__pager">
            <span>
              {String(index + 1).padStart(2, "0")}
              <em> / {String(SLIDES.length).padStart(2, "0")}</em>
            </span>
            <div className="home-hero__dots">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`home-hero__dot ${i === index ? "is-active" : ""}`}
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => go(i)}
                />
              ))}
            </div>
          </div>

          <div className="home-hero__navs">
            <button
              type="button"
              className="home-hero__nav"
              aria-label="Sebelumnya"
              onClick={() => go(index - 1)}
            >
              <ChevronLeft size={17} />
            </button>
            <button
              type="button"
              className="home-hero__nav"
              aria-label="Berikutnya"
              onClick={() => go(index + 1)}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
