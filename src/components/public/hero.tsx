"use client";

import { useState } from "react";
import Image from "next/image";

export function Hero() {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <section
      id="hero"
      className="flex items-center justify-center relative overflow-hidden bg-[#0A0A1A] min-h-[100svh]"
    >
      {/* Animated Background Slideshow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className={`hero-slideshow ${isPaused ? "is-paused" : ""}`}
          aria-hidden="true"
        >
          <div
            className="hero-slide hero-slide-0"
            style={{
              backgroundImage:
                "url('https://res.cloudinary.com/djkudkxmx/image/upload/v1790626126/screen_2_fcf81s.jpg')",
            }}
          ></div>
          <div
            className="hero-slide hero-slide-1"
            style={{
              backgroundImage:
                "url('https://res.cloudinary.com/djkudkxmx/image/upload/v1790626122/screen_1_dzwyjz.jpg')",
            }}
          ></div>
          <div
            className="hero-slide hero-slide-2"
            style={{
              backgroundImage:
                "url('https://res.cloudinary.com/djkudkxmx/image/upload/v1790626121/screen_3_gkjtrh.jpg')",
            }}
          ></div>
        </div>
        <div id="particles" className="absolute inset-0"></div>
      </div>

      {/* Accessible animation pause control */}
      <button
        type="button"
        onClick={() => setIsPaused(!isPaused)}
        aria-label={isPaused ? "Resume animation" : "Pause animation"}
        className="hero-pause-toggle absolute bottom-6 left-6 z-20 flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-3 py-1.5 text-xs text-white/80 backdrop-blur-md transition-colors hover:border-[#FF7F24]/60 hover:text-white"
      >
        <i
          className={`fas fa-${isPaused ? "play" : "pause"} text-[10px]`}
          aria-hidden="true"
        ></i>
        <span>{isPaused ? "Resume animation" : "Pause animation"}</span>
      </button>

      {/* Centered Animated KSITM Identity */}
      <div className="hero-content-wrap">
        <div className="hero-content-card">
          <div className="ksitm-hero-logo" aria-label="KSITM">
            <div className="ksitm-shield-stage">
              <div className="ksitm-shield-glow"></div>
              <Image
                src="https://res.cloudinary.com/djkudkxmx/image/upload/v1790374243/KSITM_shield_pfusir.png"
                alt="KSITM Shield"
                width={255}
                height={300}
                priority
                className="ksitm-shield"
              />
            </div>

            <h1 className="ksitm-motto" aria-label="Advancing Futures">
              <span className="ksitm-major">ADVANCING</span>{" "}
              <span className="ksitm-minor">FUTURES</span>
              <span className="ksitm-underline-reveal" aria-hidden="true">
                <svg
                  className="ksitm-underline"
                  viewBox="0 0 320 32"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                >
                  <path
                    d="M4 21 C54 21 89 21 128 21 C151 21 152 5 169 5 C188 5 185 29 169 29 C151 29 151 13 178 13 C216 13 256 21 316 21"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </h1>
          </div>

          <a
            href="#services"
            className="hero-cta inline-flex items-center gap-3 mt-12 px-8 py-4 rounded-full bg-[#FF7F24] text-[#0A0A1A] font-extrabold shadow-lg shadow-orange-600/25 hover:bg-white hover:-translate-y-1 transition-all"
          >
            Start Your Journey Now{" "}
            <i className="fas fa-arrow-right" aria-hidden="true"></i>
          </a>
        </div>
      </div>

      {/* Scroll down cue */}
      <a
        className="hero-scroll-cue"
        href="#services"
        aria-label="Scroll down to Services"
      >
        <span>Scroll down</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </a>
    </section>
  );
}
