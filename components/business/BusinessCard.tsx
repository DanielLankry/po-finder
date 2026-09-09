"use client";

import {
  Star, Heart,
} from "lucide-react";
import type { BusinessWithSchedule } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { getBusinessAvailability } from "@/lib/utils/schedule";
import { CATEGORY_THEME } from "@/lib/category-theme";
import SafeBusinessImage from "./SafeBusinessImage";

interface BusinessCardProps {
  business: BusinessWithSchedule;
  isSelected: boolean;
  isHovered?: boolean;
  isFavorited?: boolean;
  scrollRef?: (node: HTMLDivElement | null) => void;
  onClick: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onFavoriteToggle?: () => void;
  badgeLabel?: string;
  hideFavorite?: boolean;
  disabled?: boolean;
}
export default function BusinessCard({
  business,
  isSelected,
  isHovered,
  isFavorited = false,
  scrollRef,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFavoriteToggle,
  badgeLabel,
  hideFavorite = false,
  disabled = false,
}: BusinessCardProps) {
  const schedule = business.today_schedule ?? null;
  const availability = getBusinessAvailability(business);
  const primaryPhoto =
    business.photos?.find((p) => p.is_primary) ?? business.photos?.[0];
  const address = schedule?.address ?? business.address;
  const chip = CATEGORY_THEME[business.category];

  return (
    <div
      ref={scrollRef} 
      className="relative px-2 py-2"
      onMouseEnter={onMouseEnter} 
      onMouseLeave={onMouseLeave}
    >
      <button
        onClick={onClick}
        disabled={disabled}
        className={`brand-panel w-full text-right transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4552D] focus-visible:ring-offset-2 group relative block p-3.5 ${disabled ? "cursor-default" : "cursor-pointer"} ${
          isSelected 
            ? "ring-2 ring-[#C4552D] ring-offset-2" 
            : isHovered 
              ? "-translate-y-0.5"
              : "hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transform-none"
        }`}
        aria-pressed={isSelected}
        aria-disabled={disabled}
        aria-label={`${business.name} — ${CATEGORY_LABELS[business.category]}`}
      >
        <div className="flex flex-col gap-3.5" dir="rtl">
          {/* ── Photo wrapper (aspect square) ───────────────────────────────── */}
          <div className="relative w-full aspect-[4/3] rounded-xl border border-[#17402D]/20 overflow-hidden bg-[#EDE8DC] isolate">
            <SafeBusinessImage
              src={primaryPhoto?.url}
              alt={`תמונה של ${business.name}`}
              category={business.category}
              className={`h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${isHovered ? "scale-105" : "group-hover:scale-105"}`}
            />
            {primaryPhoto && (
              <div className={`absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent transition-opacity duration-300 pointer-events-none ${isHovered ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
            )}

            {badgeLabel && (
              <div className="absolute left-3 top-3 z-10 rounded-full border-2 border-[#17402D] bg-[#FFF3B0] px-3 py-1.5 text-xs font-black text-[#17402D] shadow-[2px_2px_0_0_#17402D]">
                {badgeLabel}
              </div>
            )}
            
            {/* Optional "Open Now" badge over image */}
            {availability === "open" && (
              <div className="brand-chip absolute top-3 right-3 z-10 px-3 py-1.5 pointer-events-none">
                 <span className="text-[12px] font-bold tracking-wide text-[#2D6A4F]">
                   פתוח עכשיו
                 </span>
              </div>
            )}
          </div>

          {/* ── Text content (3 lines) ───────────────────────────────────────── */}
          <div className="flex flex-col gap-1 px-1">
            {/* Line 1: Name and rating */}
            <div className="flex justify-between items-start gap-2">
              <span className="flex items-center gap-1.5 min-w-0">
                <p className="font-display font-bold text-2xl leading-tight line-clamp-1 truncate text-ink">
                  {business.name}
                </p>
              </span>
              {business.avg_rating > 0 && (
                <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                  <Star className="h-3.5 w-3.5 fill-green-800 text-green-800" aria-hidden="true" />
                  <span className="text-[13px] font-bold text-ink">
                    {business.avg_rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {/* Line 2: Address / Neighborhood */}
            {address && (
              <p className="text-sm text-stone-600 line-clamp-1 truncate font-medium">
                {address}
              </p>
            )}

            {/* Line 3: Status / Hours / Category */}
            <p className="text-[14px] text-[#717171] mt-1 font-medium flex gap-1.5 items-center">
               <span
                 className="font-semibold px-2 py-0.5 rounded-md text-[13px]"
                 style={{ backgroundColor: chip?.background ?? "#F3F4F6", color: chip?.ink ?? "#374151" }}
               >
                 {CATEGORY_LABELS[business.category]}
               </span>
               {schedule?.open_time && schedule?.close_time && (
                 <>
                   <span className="text-gray-300">•</span>
                   <span className="text-[#222222]">
                     {schedule.open_time.slice(0, 5)}–{schedule.close_time.slice(0, 5)}
                   </span>
                 </>
               )}
            </p>
          </div>
        </div>
      </button>
      {!hideFavorite && (
        <button
          type="button"
          onClick={onFavoriteToggle}
          className="brand-icon-button absolute left-7 top-7 z-10 flex h-11 w-11 items-center justify-center rounded-full hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4552D] focus-visible:ring-offset-2"
          aria-label={isFavorited ? "הסר ממועדפים" : "שמור למועדפים"}
          aria-pressed={isFavorited}
        >
          <Heart
            className={`h-5 w-5 transition-all duration-200 ${
              isFavorited ? "scale-110 fill-rose-500 text-rose-500" : "text-stone-600"
            }`}
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  );
}
