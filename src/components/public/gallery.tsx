"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

type PublishedGalleryItem = {
  id?: string;
  imageUrl: string;
  imageAlt: string;
  title: string;
  caption: string;
};

function GalleryItemCard({
  item,
}: {
  item: { src: string; alt: string; title: string; caption: string };
}) {
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

export function Gallery({
  items = [],
  fullPage = false,
}: {
  items?: PublishedGalleryItem[];
  fullPage?: boolean;
}) {
  const allItems = (items || [])
    .map((item) => ({
      src: item.imageUrl,
      alt: item.imageAlt || item.title,
      title: item.title,
      caption: item.caption,
    }))
    .filter((item) => item.src && !item.src.includes("8q8pmc8q8pmc8q8p"));

  if (allItems.length === 0) return null;

  const visibleItems = fullPage ? allItems : allItems.slice(0, 9);
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
          {!fullPage && <Link href="/gallery" className="mt-5 inline-flex text-sm font-bold text-[#FF7F24] transition-colors hover:text-[#40297B]">See more gallery <i className="fas fa-arrow-right ml-2" aria-hidden="true" /></Link>}
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
