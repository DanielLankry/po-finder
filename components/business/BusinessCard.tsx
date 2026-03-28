"use client";

import {
  Star, Heart,
  Coffee, CakeSlice, Beef, UtensilsCrossed, Leaf, Wheat, Flower2, Gem, Shirt, MapPin,
} from "lucide-react";
import type { BusinessWithSchedule } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { isOpenNow } from "@/lib/utils/schedule";
import { BorderRotate } from "@/components/ui/BorderRotate";

// ── SVG icons per category ────────────────────────────────────────────────────
const CATEGORY_ICON_LG: Record<string, React.ReactNode> = {
  coffee:  <Coffee className="h-8 w-8" />,
  food:    <UtensilsCrossed className="h-8 w-8" />,
  sweets:  <CakeSlice className="h-8 w-8" />,
  meat:    <Beef className="h-8 w-8" />,
  vegan:   <Leaf className="h-8 w-8" />,
  celiac:  <Wheat className="h-8 w-8" />,
  flowers: <Flower2 className="h-8 w-8" />,
  jewelry: <Gem className="h-8 w-8" />,
  vintage: <Shirt className="h-8 w-8" />,
};

// Color-coded chips per category
const CATEGORY_CHIP: Record<string, { bg: string; text: string }> = {
  coffee:  { bg: "#FEF3C7", text: "#92400E" },
  food:    { bg: "#FFEDD5", text: "#C2410C" },
  sweets:  { bg: "#FCE7F3", text: "#BE185D" },
  meat:    { bg: "#FEE2E2", text: "#991B1B" },
  vegan:   { bg: "#DCFCE7", text: "#166534" },
  celiac:  { bg: "#FEF9C3", text: "#78350F" },
  flowers: { bg: "#FDF2F8", text: "#9D174D" },
  jewelry: { bg: "#EDE9FE", text: "#5B21B6" },
  vintage: { bg: "#F5F0FF", text: "#6D28D9" },
};

interface BusinessCardProps {
  business: BusinessWithSchedule;
  isSelected: boolean;
  isHovered?: boolean;
  isFavorited?: boolean;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  onClick: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onFavoriteToggle?: () => void;
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
}: BusinessCardProps) {
  const schedule = business.today_schedule ?? null;
  const open = isOpenNow(schedule);
  const primaryPhoto =
    business.photos?.find((p) => p.is_primary) ?? business.photos?.[0];
  const address = schedule?.address ?? business.address;
  const chip = CATEGORY_CHIP[business.category];

  return (
    <div 
      ref={scrollRef} 
      className="px-2 py-2" 
      onMouseEnter={onMouseEnter} 
      onMouseLeave={onMouseLeave}
    >
      <BorderRotate
        active={isHovered || isSelected}
        borderRadius={26}
        borderWidth={2}
        bg="#ffffff"
        colors={{ primary: "#059669", secondary: "#34d399", accent: "#a7f3d0" }}
        speed={3}
        className="transition-all duration-300"
      >
      <button
        onClick={onClick}
        className={`w-full text-right cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] rounded-[24px] group relative bg-white block p-3.5 ${
          isSelected 
            ? "shadow-[0_8px_24px_rgba(5,150,105,0.25)] scale-[1.02]" 
            : isHovered 
              ? "shadow-[0_20px_40px_rgba(0,0,0,0.12)] scale-[1.02] transform -translate-y-1"
              : "shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] transform hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]"
        }`}
        aria-pressed={isSelected}
        aria-label={`${business.name} — ${CATEGORY_LABELS[business.category]}`}
      >
        <div className="flex flex-col gap-3.5" dir="rtl">
          {/* ── Photo wrapper (aspect square) ───────────────────────────────── */}
          <div className="relative w-full aspect-[4/3] rounded-[16px] overflow-hidden bg-[#F0F0EC] isolate">
            {primaryPhoto ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={primaryPhoto.url}
                  alt={`תמונה של ${business.name}`}
                  className={`w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${isHovered ? 'scale-105' : 'group-hover:scale-105'}`}
                  loading="lazy"
                />
                <div className={`absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent transition-opacity duration-300 pointer-events-none ${isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
              </>
            ) : (
              <div
                className={`w-full h-full flex items-center justify-center transition-transform duration-500 ${isHovered ? 'scale-105' : 'group-hover:scale-105'}`}
                style={{ backgroundColor: chip?.bg ?? "#F3F4F6" }}
                aria-hidden="true"
              >
                <span style={{ color: chip?.text ?? "#6B7280" }}>
                  {CATEGORY_ICON_LG[business.category] ?? <MapPin className="h-8 w-8" />}
                </span>
              </div>
            )}
            
            {/* Heart button overlay */}
            <div
              className={`absolute top-3 left-3 z-10 p-2.5 rounded-full backdrop-blur-md transition-all duration-300 ${
                isFavorited
                  ? "opacity-100 bg-white/90"
                  : `bg-white/10 hover:bg-white/30 ${isHovered ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onFavoriteToggle?.();
              }}
              role="button"
              aria-label={isFavorited ? "הסר ממועדפים" : "שמור למועדפים"}
            >
              <Heart
                className={`h-5 w-5 transition-all duration-200 drop-shadow-md ${
                  isFavorited
                    ? "fill-rose-500 text-rose-500 scale-110"
                    : "text-white stroke-[2px]"
                }`}
              />
            </div>

            {/* Optional "Open Now" badge over image */}
            {open && (
              <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg pointer-events-none transition-transform duration-300 group-hover:-translate-y-0.5 border border-white/20">
                 <span className="text-[12px] font-bold tracking-wide text-[#059669]">
                   פתוח עכשיו
                 </span>
              </div>
            )}
          </div>

          {/* ── Text content (3 lines) ───────────────────────────────────────── */}
          <div className="flex flex-col gap-1 px-1">
            {/* Line 1: Name and Rating */}
            <div className="flex justify-between items-start gap-2">
              <p className={`font-extrabold text-[17px] leading-tight line-clamp-1 truncate tracking-tight transition-colors duration-200 ${isHovered ? 'text-[#059669]' : 'text-[#111111] group-hover:text-[#059669]'}`}>
                {business.name}
              </p>
              {business.avg_rating > 0 && (
                <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                  <Star className="h-3.5 w-3.5 fill-[#222222] text-[#222222]" aria-hidden="true" />
                  <span className="text-[13px] font-bold text-[#222222]">
                    {business.avg_rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {/* Line 2: Address / Neighborhood */}
            {address && (
              <p className="text-[14px] text-[#888888] line-clamp-1 truncate font-medium">
                {address}
              </p>
            )}

            {/* Line 3: Status / Hours / Category */}
            <p className="text-[14px] text-[#717171] mt-1 font-medium flex gap-1.5 items-center">
               <span
                 className="font-semibold px-2 py-0.5 rounded-md text-[13px]"
                 style={{ backgroundColor: chip?.bg ?? "#F3F4F6", color: chip?.text ?? "#374151" }}
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
      </BorderRotate>
    </div>
  );
}
