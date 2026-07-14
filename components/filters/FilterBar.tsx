"use client";

import { Coffee, CakeSlice, Beef, UtensilsCrossed, Leaf, Wheat, Flower2, Gem, Shirt, SlidersHorizontal } from "lucide-react";
import type { BusinessCategory } from "@/lib/types";
import PlacesSearchBar, { type LocationResult } from "@/components/map/PlacesSearchBar";

type Category = BusinessCategory | "all";

function CategoryButton({ value, label, icon, active, index, onClick }: {
  value: Category;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  index: number;
  onClick: (v: Category) => void;
}) {
  return (
    <button
      onClick={() => onClick(value)}
      aria-pressed={active}
      data-active={active}
      className="business-type-button flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-2.5 outline-none"
      style={{ "--pill-delay": `${Math.min(index * 18, 140)}ms` } as React.CSSProperties}
    >
      {icon && (
        <span aria-hidden="true" className="business-type-icon">
          {icon}
        </span>
      )}
      <span className="text-[14px] font-bold">
        {label}
      </span>
    </button>
  );
}

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
      className="fixed top-[72px] inset-x-0 z-10 bg-[#F7F3EA] border-b-2 border-[#17402D]/10 transition-all duration-300"
      dir="rtl"
    >
      {/* Mobile-only search row */}
      {onLocationSelect && (
        <div className="md:hidden px-4 pt-2.5 pb-1">
          <PlacesSearchBar onLocationSelect={onLocationSelect} />
        </div>
      )}

      <div className="flex items-center justify-between gap-4 py-3 px-5">
        {/* Category pills */}
        <div className="flex-1 overflow-hidden py-1 -my-1">

          {/* Mobile — touch-scrollable row (RTL: scroll from right) */}
          <div
            className="md:hidden flex gap-2.5 overflow-x-auto scrollbar-hide items-center px-1 py-1"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {CATEGORIES.map(({ value, label, icon }, index) => (
              <CategoryButton key={value} value={value} label={label} icon={icon} active={activeCategory === value} index={index} onClick={onCategoryChange} />
            ))}
          </div>

          {/* Desktop — static scrollable row */}
          <div className="hidden md:flex gap-2.5 overflow-x-auto scrollbar-hide items-center px-1 py-1">
            {CATEGORIES.map(({ value, label, icon }, index) => (
              <CategoryButton key={value} value={value} label={label} icon={icon} active={activeCategory === value} index={index} onClick={onCategoryChange} />
            ))}
          </div>

        </div>

        {/* Filter button */}
        <button
          onClick={onFilterOpen}
          className="flex items-center gap-2 h-11 px-5 rounded-full border-2 border-[#17402D]/15 bg-white text-[#17402D] text-sm font-bold shadow-[2px_2px_0_0_rgba(23,64,45,0.15)] hover:border-[#17402D] hover:shadow-[3px_3px_0_0_#17402D] hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2 flex-shrink-0"
          aria-label="פתיחת סינון מתקדם"
        >
          <SlidersHorizontal className="h-4.5 w-4.5" aria-hidden="true" />
          סינון
        </button>
      </div>
    </div>
  );
}
