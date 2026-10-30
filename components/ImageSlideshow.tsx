"use client";

import { useState } from "react";
import { imageList } from "@/lib/home";

export default function ImageSlideshow({ value, alt }: { value: unknown; alt: string }) {
  const images = imageList(value);
  const [i, setI] = useState(0);
  if (!images.length) return null;
  const cur = i < images.length ? i : 0;

  function go(d: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setI((cur + d + images.length) % images.length);
  }

  return (
    <div className="image-slideshow">
      {images.map((url, idx) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={url + idx}
          className={"image-slide" + (idx === cur ? " active" : "")}
          src={url}
          alt={alt}
          aria-hidden={idx !== cur}
        />
      ))}
      {images.length > 1 && (
        <>
          <button className="image-slide-arrow image-slide-prev" type="button" aria-label="Gambar sebelumnya" onClick={(e) => go(-1, e)}>‹</button>
          <button className="image-slide-arrow image-slide-next" type="button" aria-label="Gambar berikutnya" onClick={(e) => go(1, e)}>›</button>
          <span className="image-slide-counter" aria-live="polite">{cur + 1} / {images.length}</span>
        </>
      )}
    </div>
  );
}

export function CardMedia({ value, alt, placeholder }: { value: unknown; alt: string; placeholder?: string }) {
  if (!imageList(value).length) {
    return placeholder ? <div className="card-media">{placeholder}</div> : null;
  }
  return (
    <div className="card-media has-slideshow">
      <ImageSlideshow value={value} alt={alt} />
    </div>
  );
}