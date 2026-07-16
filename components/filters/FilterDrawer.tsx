"use client";

import { Check, Clock3, RotateCcw, SlidersHorizontal, Star, X } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import type { KashrutStatus } from "@/lib/types";

export interface FilterState {
  kashrut: KashrutStatus | "all";
  minRating: number;
  openNow: boolean;
}

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const KASHRUT_OPTIONS: { value: FilterState["kashrut"]; label: string }[] = [
  { value: "all",            label: "הכל" },
  { value: "kosher",         label: "כשר" },
  { value: "kosher_mehadrin",label: "כשר למהדרין" },
  { value: "none",           label: "ללא כשרות" },
];

export default function FilterDrawer({
  open,
  onClose,
  filters,
  onFiltersChange,
}: FilterDrawerProps) {
  function update(partial: Partial<FilterState>) {
    onFiltersChange({ ...filters, ...partial });
  }

  function handleReset() {
    onFiltersChange({ kashrut: "all", minRating: 0, openNow: false });
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-[min(24rem,calc(100vw-0.75rem))] gap-0 p-0" dir="rtl" showCloseButton={false}>
        <div className="brand-canvas flex h-full flex-col">
          <SheetHeader className="flex flex-row items-center justify-between border-b-2 border-[#17402D] bg-[#FFFDF7]/90 p-5 text-right">
            <div className="flex items-center gap-3">
              <span className="brand-chip flex h-11 w-11 justify-center p-0" aria-hidden="true">
                <SlidersHorizontal className="h-5 w-5" />
              </span>
              <div>
                <SheetTitle className="font-display text-3xl leading-none text-[#17402D]">
                  סינון המפה
                </SheetTitle>
                <SheetDescription className="mt-1 text-xs font-bold text-[#8A3618]">
                  מוצאים בדיוק את מה שקרוב
                </SheetDescription>
              </div>
            </div>
            <button
              onClick={onClose}
              className="business-type-button flex h-11 w-11 min-h-11 items-center justify-center p-0"
              aria-label="סגירת סינון"
            >
              <X className="h-4 w-4" />
            </button>
          </SheetHeader>

          <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
            <section className="brand-panel-soft p-4" aria-labelledby="open-now-label">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DDEBE0] text-[#17402D]">
                    <Clock3 className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p id="open-now-label" className="font-display text-2xl leading-none text-[#17402D]">
                      פתוח עכשיו
                    </p>
                    <p className="mt-1 text-xs text-stone-500">רק עסקים שפתוחים ברגע זה</p>
                  </div>
                </div>
                <button
                  id="open-now-toggle"
                  role="switch"
                  aria-checked={filters.openNow}
                  onClick={() => update({ openNow: !filters.openNow })}
                  className="inline-flex h-11 w-14 shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#2D6A4F]/35"
                >
                  <span className={`relative inline-flex h-7 w-13 items-center rounded-full border-2 transition-all ${filters.openNow ? "border-[#17402D] bg-[#2D6A4F] shadow-[2px_2px_0_0_#17402D]" : "border-[#17402D]/25 bg-[#F7F3EA]"}`}>
                    <span
                      className={`inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white text-[#17402D] shadow transition-transform ${
                        filters.openNow ? "-translate-x-[25px]" : "-translate-x-[2px]"
                      }`}
                    >
                      {filters.openNow ? <Check className="h-3 w-3" /> : null}
                    </span>
                  </span>
                </button>
              </div>
            </section>

            <section className="brand-panel-soft p-4" aria-labelledby="kashrut-label">
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <p id="kashrut-label" className="font-display text-2xl leading-none text-[#17402D]">כשרות</p>
                  <p className="mt-1 text-xs text-stone-500">בחרו אפשרות אחת</p>
                </div>
                <span className="brand-chip px-2.5 py-1 text-xs">{KASHRUT_OPTIONS.find((option) => option.value === filters.kashrut)?.label}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {KASHRUT_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => update({ kashrut: value })}
                    aria-pressed={filters.kashrut === value}
                    data-active={filters.kashrut === value}
                    className="business-type-button flex min-h-12 w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-black"
                  >
                    {label}
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${filters.kashrut === value ? "border-white bg-white/20" : "border-[#17402D]/25"}`} aria-hidden="true">
                      {filters.kashrut === value ? <Check className="h-3 w-3" /> : null}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="brand-panel-soft p-4" aria-labelledby="rating-label">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-[#F4B942] text-[#8A3618]" aria-hidden="true" />
                  <p id="rating-label" className="font-display text-2xl leading-none text-[#17402D]">דירוג מינימלי</p>
                </div>
                <span className="brand-chip px-2.5 py-1 text-xs">
                  {filters.minRating > 0 ? `★ ${filters.minRating}+` : "הכל"}
                </span>
              </div>
              <Slider
                min={0}
                max={5}
                step={0.5}
                value={[filters.minRating]}
                onValueChange={([v]) => update({ minRating: v })}
                className="w-full"
                aria-label="דירוג מינימלי"
              />
              <div className="mt-1 flex justify-between text-xs font-bold text-[#17402D]/50">
                <span>5 ★</span>
                <span>הכל</span>
              </div>
            </section>
          </div>

          <div className="flex gap-3 border-t-2 border-[#17402D] bg-[#FFFDF7]/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              onClick={handleReset}
              className="brand-control flex h-12 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-black text-[#17402D]"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              איפוס
            </button>
            <button
              onClick={onClose}
              className="brand-button flex h-12 flex-[1.35] items-center justify-center rounded-xl px-3 text-sm font-black"
            >
              החל סינון
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
