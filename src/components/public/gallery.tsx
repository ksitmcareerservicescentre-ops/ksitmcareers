"use client";

import { useState } from "react";
import Image from "next/image";

const galleryItems = [
  {
    src: "https://res.cloudinary.com/djkudkxmx/image/upload/v1790510808/12_gejlfg.jpg",
    alt: "KSITM gallery photo: Learning together",
    title: "Learning together",
    caption: "Scenes from the shared learning experience at KSITM.",
  },
  {
    src: "https://res.cloudinary.com/djkudkxmx/image/upload/v1790510807/19_ogvqvj.jpg",
    alt: "KSITM gallery photo: Community in focus",
    title: "Community in focus",
    caption: "A snapshot of connection and activity around the institute.",
  },
  {
    src: "https://res.cloudinary.com/djkudkxmx/image/upload/v1790510808/17_yg0hpl.jpg",
    alt: "KSITM gallery photo: Another perspective",
    title: "Another perspective",
    caption: "Explore another scene from the KSITM gallery.",
  },
  {
    src: "https://res.cloudinary.com/djkudkxmx/image/upload/v1790510808/13_xlkzft.jpg",
    alt: "KSITM gallery photo: Shared experiences",
    title: "Shared experiences",
    caption: "A further glimpse into the KSITM community.",
  },
  {
    src: "https://res.cloudinary.com/djkudkxmx/image/upload/v1790675969/Gemini_Generated_Image_wd6fouwd6fouwd6f_unakt3.jpg",
    alt: "KSITM gallery photo: Shared experiences",
    title: "Shared experiences",
    caption: "A further glimpse into the KSITM community.",
  },
  {
    src: "https://res.cloudinary.com/djkudkxmx/image/upload/v1790675990/Gemini_Generated_Image_8q8pmc8q8pmc8q8p_dsqkay.jpg",
    alt: "KSITM gallery photo: Shared experiences",
    title: "Shared experiences",
    caption: "A further glimpse into the KSITM community.",
  },
  {
    src: "https://res.cloudinary.com/djkudkxmx/image/upload/v1790675990/Gemini_Generated_Image_9560vq9560vq9560_avlrqc.jpg",
    alt: "KSITM gallery photo: Shared experiences",
    title: "Shared experiences",
    caption: "A further glimpse into the KSITM community.",
  },
  {
    src: "https://res.cloudinary.com/djkudkxmx/image/upload/v1790703234/ChatGPT_Image_Sep_29_2026_06_33_23_PM_diyx8d.png",
    alt: "KSITM gallery photo: Shared experiences",
    title: "Shared experiences",
    caption: "A further glimpse into the KSITM community.",
  },
];

type PublishedGalleryItem = { imageUrl: string; imageAlt: string; title: string; caption: string };

function GalleryItemCard({ item }: { item: (typeof galleryItems)[0] }) {
  const [hasError, setHasError] = useState(false);

  return (
    <article className="gallery-card bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="gallery-image relative w-full h-[22rem] bg-gray-900 flex items-center justify-center">
        {hasError ? (
          <div className="image-fallback flex flex-col items-center justify-center p-6 text-center text-gray-400">
            <i
              className="fas fa-image text-3xl mb-2 text-gray-500"
              aria-hidden="true"
            ></i>
            <span className="text-sm font-semibold">Image unavailable</span>
          </div>
        ) : (
          <Image
            src={item.src}
            alt={item.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
            onError={() => setHasError(true)}
          />
        )}
      </div>
      <div className="p-6">
        <p className="text-[#FF7F24] text-xs font-bold uppercase tracking-widest mb-2">
          Event gallery
        </p>
        <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{item.caption}</p>
      </div>
    </article>
  );
}

export function Gallery({ items }: { items?: PublishedGalleryItem[] }) {
  const visibleItems = items && items.length > 0 ? items.map((item) => ({ src: item.imageUrl, alt: item.imageAlt, title: item.title, caption: item.caption })) : galleryItems;
  return (
    <section id="gallery" className="py-24 bg-[#101023] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <p className="text-[#FF7F24] font-bold uppercase tracking-[.2em] text-sm mb-3">
            From our gallery
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white">
            Moments at KSITM
          </h2>
          <p className="text-gray-400 mt-4 max-w-2xl">
            Explore highlights from the institute and its community.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleItems.map((item, idx) => (
            <GalleryItemCard key={idx} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
