"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { Reveal } from "@/components/home/Reveal";

const YT_ID = "zdNsZbJTiqQ";

export function HomeVideo() {
  const [playing, setPlaying] = useState(false);

  return (
    <section className="home-video container-store">
      <Reveal>
        <div className="home-section-head home-section-head--compact">
          <div>
            <p className="section-kicker">45 Vape film</p>
            <h2 className="display section-title">Lihat lebih dekat</h2>
            <p className="section-lead">
              Cuplikan koleksi, rasa, dan device pilihan — biar belanja lebih yakin.
            </p>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className={`video-stage ${playing ? "is-playing" : ""}`}>
          <div className="video-stage__media">
            {playing ? (
              <iframe
                className="video-stage__iframe"
                src={`https://www.youtube-nocookie.com/embed/${YT_ID}?autoplay=1&rel=0&modestbranding=1`}
                title="45 Vape spotlight"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <button
                type="button"
                className="video-stage__poster"
                onClick={() => setPlaying(true)}
                aria-label="Putar video 45 Vape"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://i.ytimg.com/vi/${YT_ID}/maxresdefault.jpg`}
                  alt=""
                  className="video-stage__thumb"
                  onError={(e) => {
                    e.currentTarget.src = `https://i.ytimg.com/vi/${YT_ID}/hqdefault.jpg`;
                  }}
                />
                <span className="video-stage__veil" aria-hidden />
                <span className="video-stage__play">
                  <span className="video-stage__play-ring" aria-hidden />
                  <span className="video-stage__play-btn" aria-hidden>
                    <Play size={26} fill="currentColor" />
                  </span>
                  <span className="video-stage__play-label">Putar film</span>
                </span>
              </button>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
