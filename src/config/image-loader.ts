"use client";
import type { ImageLoaderProps } from "next/image";

// Preserve the approved source URL in content; let its existing image CDN resize
// the delivery instead of downloading multi-megabyte originals in a function.
export default function cloudinaryLoader({
  src,
  width,
  quality,
}: ImageLoaderProps) {
  const url = new URL(src);
  const prefix = "/djkudkxmx/image/upload/";
  if (url.protocol !== "https:") {
    throw new Error("Unsupported image source");
  }
  if (url.hostname !== "res.cloudinary.com" || !url.pathname.startsWith(prefix)) return src;
  const delivery = `f_auto,q_${quality ?? "auto"},w_${width},c_limit/`;
  return `${url.origin}${prefix}${delivery}${url.pathname.slice(prefix.length)}`;
}
