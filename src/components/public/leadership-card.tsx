"use client";

import { useState } from "react";
import Image from "next/image";

interface LeadershipCardProps {
  id?: string;
  name: string;
  position: string;
  image: string;
  summary: string;
  details: React.ReactNode;
  order?: number;
}

export function LeadershipCard({
  id,
  name,
  position,
  image,
  summary,
  details,
  order,
}: LeadershipCardProps) {
  const [expanded, setExpanded] = useState(false);
  const slug =
    id ||
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const biographyId = `${slug}-biography`;

  return (
    <article
      style={order ? { order } : undefined}
      className={`leader-card rounded-3xl border border-white/10 bg-gradient-to-br from-[#40297B]/25 to-[#FF7F24]/10 ${
        expanded ? "is-expanded" : ""
      }`}
    >
      <div className="leader-glow"></div>
      <div className="relative w-full h-[24rem] sm:h-[30rem] lg:h-[34rem] overflow-hidden bg-[#0A0A1A]">
        <Image
          src={image}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover object-top sm:object-contain"
        />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0A0A1A] to-transparent z-10"></div>
      </div>
      <div className="relative p-7">
        <p className="text-[#FF7F24] text-xs font-bold uppercase tracking-widest mb-2">
          {position}
        </p>
        <h3 className="text-2xl text-white font-bold mb-3">{name}</h3>
        <p className="leader-summary text-gray-300 leading-relaxed">
          {summary}
        </p>
        <div id={biographyId} className="leader-details">
          <div>
            <div className="pt-5 space-y-4 text-gray-300 leading-relaxed">
              {details}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="leader-toggle mt-5 inline-flex items-center gap-2 text-[#FF7F24] font-bold hover:text-white transition-colors bg-transparent border-0 cursor-pointer p-0"
          aria-expanded={expanded}
          aria-controls={biographyId}
          aria-label={
            expanded
              ? `Show Less about ${name}`
              : `Continue Reading about ${name}`
          }
        >
          <span>{expanded ? "Show less" : "Continue reading"}</span>
          <i className="fas fa-chevron-down leader-chevron text-xs"></i>
        </button>
      </div>
    </article>
  );
}
