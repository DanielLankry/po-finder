"use client";

import { Coffee, CakeSlice, Beef, UtensilsCrossed, Leaf, Wheat, Flower2, Gem, Shirt, SlidersHorizontal } from "lucide-react";
import type { BusinessCategory } from "@/lib/types";

type Category = BusinessCategory | "all";

interface FilterBarProps {
  activeCategory: Category;
  onCategoryChange: (cat: Category) => void;
  onFilterOpen: () => void;
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
}: FilterBarProps) {
  return (
    <div
      className="fixed top-[72px] inset-x-0 z-10 bg-white/75 backdrop-blur-xl border-b border-white/20 px-5 shadow-[0_8px_32px_rgba(0,0,0,0.04)] transition-all duration-300"
      dir="rtl"
    >
      <div className="flex items-center justify-between gap-4 py-3">
        {/* Category pills — scroll from right */}
        <div className="flex-1 overflow-x-auto scrollbar-hide py-2 mask-linear-fade -my-1">
          <div className="flex gap-2.5 w-max items-center px-1">
            {CATEGORIES.map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => onCategoryChange(value)}
                aria-pressed={activeCategory === value}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] outline-none ${
                  activeCategory === value
                    ? "bg-[#222222] text-white shadow-[0_2px_8px_rgba(5,150,105,0.45)] scale-105"
                    : "bg-white/60 text-[#717171] hover:bg-white hover:text-[#222222] hover:shadow-sm border border-black/[0.04] focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-offset-2"
                }`}
              >
                <div className={`${activeCategory === value ? "opacity-100" : "opacity-70"} transition-opacity duration-300`}>
                  {icon && <span aria-hidden="true">{icon}</span>}
                </div>
                <span className={`text-[14px] whitespace-nowrap ${activeCategory === value ? "font-semibold" : "font-medium"}`}>
                  {label}
                </span>
              </button>
            ))}
          </div>
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
