"use client";

import { useState } from "react";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import type { Photo } from "@/lib/types";

interface PhotoGridProps {
  photos: Photo[];
  businessName: string;
}

export default function PhotoGrid({ photos, businessName }: PhotoGridProps) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const sorted = [...photos].sort((a, b) =>
    b.is_primary === a.is_primary ? 0 : b.is_primary ? 1 : -1
  );

  const primary = sorted[0];
  const secondary = sorted.slice(1, 5);

  if (!primary) {
    return (
      <div className="h-64 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center">
        <p className="text-stone-400 text-sm">אין תמונות</p>
      </div>
    );
  }

  return (
    <>
      {/* Grid — RTL: primary on RIGHT, secondary on LEFT */}
      <div className="relative h-80 md:h-[420px] rounded-2xl overflow-hidden grid grid-cols-3 gap-1">
        {/* Primary photo — right column (2/3 width in RTL) */}
        <div className="col-span-2 order-last relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={primary.url}
            alt={`תמונה ראשית של ${businessName}`}
            className="w-full h-full object-cover cursor-pointer hover:brightness-95 transition-all"
            onClick={() => { setCurrentIndex(0); setGalleryOpen(true); }}
          />
        </div>

        {/* Secondary photos — left column */}
        <div className="flex flex-col gap-1">
          {secondary.slice(0, 2).map((photo, i) => (
            <div key={photo.id} className="flex-1 relative overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={`תמונה ${i + 2} של ${businessName}`}
                className="w-full h-full object-cover cursor-pointer hover:brightness-95 transition-all"
                onClick={() => { setCurrentIndex(i + 1); setGalleryOpen(true); }}
              />
            </div>
          ))}
        </div>

        {/* "Show all photos" button */}
        {sorted.length > 3 && (
          <button
            onClick={() => setGalleryOpen(true)}
            className="absolute bottom-4 left-4 bg-white border border-stone-200 text-stone-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-stone-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] shadow-card"
          >
            הצגת כל התמונות ({sorted.length})
          </button>
        )}
      </div>

      {/* Gallery modal */}
      {galleryOpen && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center scale-in"
          role="dialog"
          aria-modal="true"
          aria-label="גלריית תמונות"
        >
          {/* Close */}
          <button
            onClick={() => setGalleryOpen(false)}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="סגירת גלריה"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Counter */}
          <p className="absolute top-5 left-1/2 -translate-x-1/2 text-white text-sm">
            {currentIndex + 1} / {sorted.length}
          </p>

          {/* Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sorted[currentIndex].url}
            alt={`תמונה ${currentIndex + 1} של ${businessName}`}
            className="max-h-[80vh] max-w-[90vw] object-contain"
          />

          {/* Prev (RTL: right = previous) */}
          {currentIndex > 0 && (
            <button
              onClick={() => setCurrentIndex((i) => i - 1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="תמונה קודמת"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          {/* Next (RTL: left = next) */}
          {currentIndex < sorted.length - 1 && (
            <button
              onClick={() => setCurrentIndex((i) => i + 1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="תמונה הבאה"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
        </div>
      )}
    </>
  );
}
