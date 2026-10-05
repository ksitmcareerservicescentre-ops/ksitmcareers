"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  preload?: boolean;
};

export function ContentImage({
  src,
  alt,
  sizes,
  className = "",
  preload = false,
}: Props) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  if (failed)
    return (
      <span
        className={`image-fallback ${className}`}
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
      >
        {alt && <span>Image unavailable</span>}
      </span>
    );
  return (
    <>
      {!loaded && alt && (
        <span className="image-loading" aria-hidden="true">
          Loading image…
        </span>
      )}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        preload={preload}
        className={className}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </>
  );
}
