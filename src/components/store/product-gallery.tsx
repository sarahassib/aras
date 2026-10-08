"use client";

import { useState } from "react";

export function ProductGallery({
  images,
  name,
}: {
  images: { url: string; alt: string | null }[];
  name: string;
}) {
  const list = images.length > 0 ? images : [{ url: "", alt: name }];
  const [active, setActive] = useState(0);
  const current = list[Math.min(active, list.length - 1)];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted">
        {current.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.url}
            alt={current.alt ?? name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-navy-300">
            ARAS
          </div>
        )}
      </div>
      {list.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {list.map((image, i) => (
            <button
              key={`${image.url}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              className={`size-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === active ? "border-gold-500" : "border-transparent hover:border-border"
              }`}
              aria-label={`${name} ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
