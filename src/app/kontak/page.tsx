import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import { CONTACT, STORE_BRANCHES, mapsUrl } from "@/lib/branches";
import { whatsappUrl } from "@/lib/store";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Kontak Kami",
  description:
    "Hubungi 45 Vape Group — WhatsApp, email, dan daftar cabang resmi. Tim kami siap bantu rekomendasi produk dan status pesanan.",
  path: "/kontak",
  keywords: ["kontak 45 vape", "45 vape group", "cabang 45 vape", "whatsapp 45 vape"],
});

export default function ContactPage() {
  return (
    <div className="contact-page">
      <section className="contact-hero">
        <div className="contact-hero__glow" aria-hidden />
        <div className="container-store">
          <div className="contact-hero__panel">
            <div className="contact-hero__main">
              <div className="contact-hero__logo-frame">
                <Image
                  src={CONTACT.groupLogo}
                  alt="45 Vape Group"
                  width={280}
                  height={280}
                  className="contact-hero__logo"
                  priority
                />
              </div>

              <div className="contact-hero__copy">
                <p className="section-kicker">Hubungi kami</p>
                <h1 className="display contact-hero__title">
                  Kontak resmi
                  <span>45 Vape Group</span>
                </h1>
                <p className="contact-hero__lead">{CONTACT.about}</p>
                <div className="contact-hero__actions">
                  <a
                    href={whatsappUrl("Halo 45 Vape Group, saya ingin bertanya.")}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                  >
                    <MessageCircle size={16} />
                    Chat WhatsApp
                  </a>
                  <Link href="/products" className="btn btn-ghost">
                    Lihat katalog
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </div>

            <div className="contact-hero__rails">
              <a href={`tel:${CONTACT.phoneTel}`} className="contact-rail">
                <span className="contact-rail__icon" aria-hidden>
                  <Phone size={17} />
                </span>
                <span>
                  <em>Telepon / WhatsApp</em>
                  <strong>{CONTACT.phoneDisplay}</strong>
                </span>
              </a>
              <a href={`mailto:${CONTACT.email}`} className="contact-rail">
                <span className="contact-rail__icon" aria-hidden>
                  <Mail size={17} />
                </span>
                <span>
                  <em>Email</em>
                  <strong>{CONTACT.email}</strong>
                </span>
              </a>
              <div className="contact-rail contact-rail--static">
                <span className="contact-rail__icon" aria-hidden>
                  <MapPin size={17} />
                </span>
                <span>
                  <em>Lokasi</em>
                  <strong>{CONTACT.city}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-store contact-branches" id="cabang">
        <div className="contact-branches__head">
          <div>
            <p className="section-kicker">Kunjungi kami</p>
            <h2 className="display section-title">Cabang & layanan</h2>
            <p className="section-lead">
              Temukan outlet resmi 45 Vape Group atau hubungi customer care untuk order online.
            </p>
          </div>
          <span className="contact-branches__count">
            {STORE_BRANCHES.length} lokasi layanan
          </span>
        </div>

        <div className="branch-grid">
          {STORE_BRANCHES.map((branch, index) => (
            <article
              key={branch.id}
              className={`branch-card${branch.featured ? " branch-card--featured" : ""}`}
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <header className="branch-card__head">
                <div>
                  <span className="branch-card__tag">{branch.tag}</span>
                  <h3 className="display branch-card__name">{branch.name}</h3>
                </div>
                <span className="branch-card__index" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
              </header>

              <dl className="branch-card__facts">
                <div className="branch-fact">
                  <dt>
                    <MapPin size={14} />
                    Alamat
                  </dt>
                  <dd>{branch.address}</dd>
                </div>
                <div className="branch-fact">
                  <dt>
                    <Clock3 size={14} />
                    Jam operasional
                  </dt>
                  <dd>{branch.hours}</dd>
                </div>
                <div className="branch-fact">
                  <dt>
                    <Phone size={14} />
                    Telepon
                  </dt>
                  <dd>
                    <a href={`tel:${branch.phoneTel}`}>{branch.phoneDisplay}</a>
                  </dd>
                </div>
                {branch.email ? (
                  <div className="branch-fact">
                    <dt>
                      <Mail size={14} />
                      Email
                    </dt>
                    <dd>
                      <a href={`mailto:${branch.email}`}>{branch.email}</a>
                    </dd>
                  </div>
                ) : null}
              </dl>

              <div className="branch-card__actions">
                <a
                  href={whatsappUrl(`Halo 45 Vape (${branch.name}), saya ingin bertanya.`)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary branch-card__btn"
                >
                  <MessageCircle size={15} />
                  WhatsApp
                </a>
                <a
                  href={mapsUrl(branch.mapsQuery)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost branch-card__btn"
                >
                  Peta
                  <ExternalLink size={14} />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="container-store contact-cta">
        <div className="contact-cta__panel">
          <div className="contact-cta__brand" aria-hidden>
            <Image
              src={CONTACT.groupLogo}
              alt=""
              width={120}
              height={120}
              className="contact-cta__logo"
            />
          </div>
          <div className="contact-cta__copy">
            <p className="section-kicker">Butuh bantuan cepat?</p>
            <h2 className="display contact-cta__title">Tim 45 Vape Group siap membantu</h2>
            <p>
              Tanya stok, rekomendasi rasa, atau status pesanan — cukup chat WhatsApp.
            </p>
          </div>
          <a
            href={whatsappUrl("Halo 45 Vape Group, saya butuh bantuan.")}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
          >
            <MessageCircle size={16} />
            Hubungi sekarang
          </a>
        </div>
      </section>
    </div>
  );
}
