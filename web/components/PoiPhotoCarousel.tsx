"use client";

import { useCallback, useEffect, useState } from "react";

export type PoiCarouselPhoto = {
  url: string;
  label: string;
};

type Props = {
  photos: PoiCarouselPhoto[];
};

export function PoiPhotoCarousel({ photos }: Props) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const count = photos.length;
  const thumb = photos[0];
  const safeActive = count === 0 ? 0 : Math.min(activeIndex, count - 1);
  const current = photos[safeActive];
  const canPrev = safeActive > 0;
  const canNext = safeActive < count - 1;

  useEffect(() => {
    if (activeIndex >= count && count > 0) setActiveIndex(count - 1);
  }, [count, activeIndex]);

  const goPrev = useCallback(() => {
    setActiveIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    setActiveIndex((i) => Math.min(count - 1, i + 1));
  }, [count]);

  const openLightbox = useCallback(() => {
    setActiveIndex(0);
    setLightboxOpen(true);
  }, []);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft" && count > 1) {
        e.preventDefault();
        goPrev();
      }
      if (e.key === "ArrowRight" && count > 1) {
        e.preventDefault();
        goNext();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxOpen, count, goPrev, goNext]);

  if (count === 0 || !thumb || !current) return null;

  const thumbAria =
    count > 1
      ? `Open photo viewer — ${count} photos, starting with ${thumb.label}`
      : `View larger: ${thumb.label}`;

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openLightbox}
          className="relative h-16 w-16 shrink-0 cursor-zoom-in overflow-hidden rounded-md border border-zinc-200 transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:border-zinc-700"
          aria-label={thumbAria}
        >
          <img
            src={thumb.url}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center gap-1 px-1 pb-1 pt-5 bg-linear-to-t from-black/55 to-transparent"
            aria-hidden
          >
            {photos.map((_, i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/95 shadow-[0_0_0_1px_rgba(0,0,0,0.25)]"
              />
            ))}
          </div>
        </button>
      </div>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 p-4 pt-14 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="poi-lightbox-title"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-md bg-white/15 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(false);
            }}
          >
            Close
          </button>
          {count > 1 && (
            <>
              <button
                type="button"
                className="absolute left-2 top-1/2 z-[1] -translate-y-1/2 rounded-md bg-white/15 px-3 py-2 text-sm font-medium text-white hover:bg-white/25 disabled:pointer-events-none disabled:opacity-30 sm:left-4"
                disabled={!canPrev}
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                aria-label="Previous photo"
              >
                ←
              </button>
              <button
                type="button"
                className="absolute right-2 top-1/2 z-[1] -translate-y-1/2 rounded-md bg-white/15 px-3 py-2 text-sm font-medium text-white hover:bg-white/25 disabled:pointer-events-none disabled:opacity-30 sm:right-4"
                disabled={!canNext}
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                aria-label="Next photo"
              >
                →
              </button>
            </>
          )}
          <img
            src={current.url}
            alt={current.label}
            className="max-h-[min(84vh,960px)] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <p id="poi-lightbox-title" className="mt-3 max-w-lg text-center text-sm text-white/90">
            {current.label}
          </p>
          {count > 1 && (
            <p className="mt-1 text-center text-xs text-white/60">
              Photo {safeActive + 1} of {count} · use arrows or ← → to browse
            </p>
          )}
          <p className="mt-1 text-center text-xs text-white/50">Click outside or Escape to close</p>
        </div>
      )}
    </>
  );
}
