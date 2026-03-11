"use client";

import { Coffee, CakeSlice, Beef, UtensilsCrossed, Leaf, Wheat, Flower2, Gem, Shirt, SlidersHorizontal } from "lucide-react";
import type { BusinessCategory } from "@/lib/types";
import PlacesSearchBar, { type LocationResult } from "@/components/map/PlacesSearchBar";
import { Marquee } from "@/components/ui/marquee";

type Category = BusinessCategory | "all";

interface FilterBarProps {
  activeCategory: Category;
  onCategoryChange: (cat: Category) => void;
  onFilterOpen: () => void;
  onLocationSelect?: (loc: LocationResult) => void;
}

const CATEGORIES: { value: Category; label: string; icon: React.ReactNode }[] = [
  { value: "all",     label: "הכל",              icon: null },
  { value: "coffee",  label: "קפה ושתייה",        icon: <Coffee className="h-4 w-4" /> },
  { value: "food",    label: "אוכל",              icon: <UtensilsCrossed className="h-4 w-4" /> },
  { value: "sweets",  label: "מתוקים ומאפים",     icon: <CakeSlice className="h-4 w-4" /> },
  { value: "meat",    label: "בשרים",             icon: <Beef className="h-4 w-4" /> },
  { value: "vegan",   label: "טבעוני וצמחוני",    icon: <Leaf className="h-4 w-4" /> },
  { value: "celiac",  label: "ידידותי לצליאקים",  icon: <Wheat className="h-4 w-4" /> },
  { value: "flowers", label: "פרחים",             icon: <Flower2 className="h-4 w-4" /> },
  { value: "jewelry", label: "תכשיטים",           icon: <Gem className="h-4 w-4" /> },
  { value: "vintage", label: "וינטג׳ ויד שנייה",  icon: <Shirt className="h-4 w-4" /> },
];

export default function FilterBar({
  activeCategory,
  onCategoryChange,
  onFilterOpen,
  onLocationSelect,
}: FilterBarProps) {
  return (
    <div
      className="fixed top-[72px] inset-x-0 z-10 bg-[#FAFAF7]/90 backdrop-blur-xl border-b border-black/[0.06] shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all duration-300"
      dir="rtl"
    >
      {/* Mobile-only search row */}
      {onLocationSelect && (
        <div className="md:hidden px-4 pt-2.5 pb-1">
          <PlacesSearchBar onLocationSelect={onLocationSelect} />
        </div>
      )}

      <div className="flex items-center justify-between gap-4 py-3 px-5">
        {/* Category pills — marquee */}
        <div className="flex-1 overflow-hidden py-1 -my-1" dir="ltr">
          <Marquee
            duration={30}
            pauseOnHover
            direction="left"
            fade
            fadeAmount={8}
            className="py-1"
          >
            {CATEGORIES.map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => onCategoryChange(value)}
                aria-pressed={activeCategory === value}
                className={`flex items-center gap-2 mx-1.5 px-4 py-2.5 rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] outline-none whitespace-nowrap ${
                  activeCategory === value
                    ? "bg-[#059669] text-white shadow-[0_2px_8px_rgba(5,150,105,0.45)] scale-105"
                    : "bg-white/80 text-[#717171] hover:bg-white hover:text-[#222222] hover:shadow-sm border border-black/[0.06] focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-offset-2"
                }`}
              >
                {icon && (
                  <span aria-hidden="true" className={activeCategory === value ? "opacity-100" : "opacity-70"}>
                    {icon}
                  </span>
                )}
                <span className={`text-[14px] ${activeCategory === value ? "font-semibold" : "font-medium"}`}>
                  {label}
                </span>
              </button>
            ))}
          </Marquee>
        </div>

        {/* Filter button */}
        <button
          onClick={onFilterOpen}
          className="flex items-center gap-2 h-11 px-5 rounded-full border border-black/5 bg-white/90 backdrop-blur-md text-[#222222] text-sm font-semibold shadow-sm hover:shadow-md hover:bg-white hover:-translate-y-0.5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-offset-2 flex-shrink-0"
          aria-label="פתיחת סינון מתקדם"
        >
          <SlidersHorizontal className="h-4.5 w-4.5" aria-hidden="true" />
          סינון
        </button>
      </div>
    </div>
  );
}
