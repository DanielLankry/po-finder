"use client";

import { useEffect, useRef } from "react";
import { X, Heart } from "lucide-react";
import type { BusinessWithSchedule } from "@/lib/types";
import BusinessCard from "./BusinessCard";

interface FavoritesPanelProps {
  open: boolean;
  onClose: () => void;
  businesses: BusinessWithSchedule[];
  favoriteIds: Set<string>;
  onFavoriteToggle: (id: string) => void;
  onBusinessSelect: (b: BusinessWithSchedule) => void;
  selectedBusinessId: string | null;
}

export default function FavoritesPanel({
  open,
  onClose,
  businesses,
  favoriteIds,
  onFavoriteToggle,
  onBusinessSelect,
  selectedBusinessId,
}: FavoritesPanelProps) {
  const saved = businesses.filter((b) => favoriteIds.has(b.id));
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[2px]"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      {open && (
        <div
          dir="rtl"
          className="brand-canvas fixed top-0 right-0 h-[100dvh] w-full max-w-sm z-[70] border-l-2 border-[#17402D] shadow-2xl flex flex-col slide-in-right"
          role="dialog"
          aria-modal="true"
          aria-labelledby="favorites-panel-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 fill-rose-500 text-rose-500" />
              <span id="favorites-panel-title" className="font-bold text-[#111] text-lg">מועדפים</span>
              {saved.length > 0 && (
                <span className="text-xs font-semibold bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">
                  {saved.length}
                </span>
              )}
            </div>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="h-11 w-11 flex items-center justify-center rounded-full hover:bg-[#EFF5F0] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F]"
              aria-label="סגור"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
            {saved.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
                <div className="h-16 w-16 rounded-full bg-rose-50 flex items-center justify-center">
                  <Heart className="h-8 w-8 text-rose-300" />
                </div>
                <div>
                  <p className="font-semibold text-[#222] mb-1">אין מועדפים עדיין</p>
                  <p className="text-sm text-[#888] leading-relaxed">
                    לחצו על סמל הלב בכרטיסיית עסק כדי לשמור אותו לכאן
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 flex flex-col gap-2">
                {saved.map((b) => (
                  <BusinessCard
                    key={b.id}
                    business={b}
                    isSelected={selectedBusinessId === b.id}
                    isFavorited
                    onFavoriteToggle={() => onFavoriteToggle(b.id)}
                    onClick={() => { onBusinessSelect(b); onClose(); }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
