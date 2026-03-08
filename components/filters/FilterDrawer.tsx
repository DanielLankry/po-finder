"use client";

import { X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
      <SheetContent side="right" className="w-80 p-0" dir="rtl">
        <div className="flex flex-col h-full">
          <SheetHeader className="flex flex-row items-center justify-between p-6 border-b border-slate-200">
            <SheetTitle className="font-display font-bold text-lg text-slate-900">
              סינון
            </SheetTitle>
            <button
              onClick={onClose}
              className="rounded-full h-8 w-8 flex items-center justify-center hover:bg-blue-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              aria-label="סגירת סינון"
            >
              <X className="h-4 w-4 text-slate-600" />
            </button>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Open Now toggle */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="open-now-toggle" className="font-medium text-slate-900">
                  פתוח עכשיו
                </label>
                <button
                  id="open-now-toggle"
                  role="switch"
                  aria-checked={filters.openNow}
                  onClick={() => update({ openNow: !filters.openNow })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                    filters.openNow ? "bg-blue-600" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      filters.openNow ? "-translate-x-[22px]" : "-translate-x-[2px]"
                    }`}
                  />
                </button>
              </div>
              <p className="text-slate-500 text-sm mt-1">הצגת עסקים שפתוחים כרגע</p>
            </div>

            {/* Kashrut */}
            <div>
              <p className="font-medium text-slate-900 mb-3">כשרות</p>
              <div className="space-y-2">
                {KASHRUT_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => update({ kashrut: value })}
                    aria-pressed={filters.kashrut === value}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 btn-press ${
                      filters.kashrut === value
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50/50"
                    }`}
                  >
                    {label}
                    {filters.kashrut === value && (
                      <span className="h-2 w-2 rounded-full bg-blue-600" aria-hidden="true" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Minimum Rating */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="font-medium text-slate-900">דירוג מינימלי</p>
                <span className="text-blue-600 font-bold">
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
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>5 ★</span>
                <span>הכל</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 btn-press"
            >
              איפוס
            </button>
            <button
              onClick={onClose}
              className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 btn-press shadow-sm"
            >
              החל סינון
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
