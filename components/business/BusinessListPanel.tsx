"use client";

import { useRef, useEffect, createRef } from "react";
import { MapPin } from "lucide-react";
import type { BusinessWithSchedule, BusinessCategory } from "@/lib/types";
import type { FilterState } from "@/components/filters/FilterDrawer";
import { isOpenNow } from "@/lib/utils/schedule";
import BusinessCard from "./BusinessCard";
import StatusCard from "./StatusCard";

interface BusinessListPanelProps {
  businesses: BusinessWithSchedule[];
  activeCategory: BusinessCategory | "all";
  filters: FilterState;
  selectedBusinessId: string | null;
  onBusinessSelect: (b: BusinessWithSchedule) => void;
  onBackToList?: () => void;
  hoveredBusinessId?: string | null;
  onBusinessHover?: (id: string | null) => void;
  loading?: boolean;
  userLocation?: { lat: number; lng: number } | null;
}

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Shimmer skeleton card ─────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      className="flex gap-3 px-5 py-4 border-b border-[#EBEBEB] border-r-[3px] border-r-transparent"
      dir="rtl"
      aria-hidden="true"
    >
      <div className="flex-1 flex flex-col gap-2.5 justify-center">
        <div className="h-4 w-24 rounded-full shimmer" />
        <div className="h-4 w-40 rounded shimmer" />
        <div className="h-3 w-32 rounded shimmer" />
        <div className="h-3 w-20 rounded shimmer" />
      </div>
      <div className="flex-shrink-0 w-[96px] h-[96px] rounded-xl shimmer" />
    </div>
  );
}

export default function BusinessListPanel({
  businesses,
  activeCategory,
  filters,
  selectedBusinessId,
  onBusinessSelect,
  onBackToList,
  hoveredBusinessId,
  onBusinessHover,
  loading = false,
  userLocation,
}: BusinessListPanelProps) {
  const cardRefs = useRef<Map<string, React.RefObject<HTMLDivElement | null>>>(new Map());

  const filtered = businesses
    .filter((b) => {
      if (activeCategory !== "all" && b.category !== activeCategory) return false;
      if (filters.kashrut !== "all" && b.kashrut !== filters.kashrut) return false;
      if (filters.minRating > 0 && b.avg_rating < filters.minRating) return false;
      if (filters.openNow && !isOpenNow(b.today_schedule ?? null)) return false;
      return true;
    })
    .sort((a, b) => {
      if (!userLocation) return 0;
      const latA = a.today_schedule?.lat ?? a.lat;
      const lngA = a.today_schedule?.lng ?? a.lng;
      const latB = b.today_schedule?.lat ?? b.lat;
      const lngB = b.today_schedule?.lng ?? b.lng;
      const dA = latA && lngA ? getDistanceKm(userLocation.lat, userLocation.lng, latA, lngA) : Infinity;
      const dB = latB && lngB ? getDistanceKm(userLocation.lat, userLocation.lng, latB, lngB) : Infinity;
      return dA - dB;
    });

  // Ensure refs map is populated
  filtered.forEach((b) => {
    if (!cardRefs.current.has(b.id)) {
      cardRefs.current.set(b.id, createRef<HTMLDivElement>());
    }
  });

  // Scroll selected card into view when selection changes (e.g. pin clicked on map)
  useEffect(() => {
    if (!selectedBusinessId) return;
    const ref = cardRefs.current.get(selectedBusinessId);
    ref?.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedBusinessId]);

  if (selectedBusinessId && !loading) {
    const selectedBusiness = businesses.find((b) => b.id === selectedBusinessId);
    if (selectedBusiness) {
      return (
        <div className="flex flex-col h-full bg-[#FAFAFA]" dir="rtl">
          {/* Header with back button */}
          <div className="px-5 py-3.5 border-b border-[#EBEBEB] bg-white flex items-center shrink-0 sticky top-0 z-10 shadow-sm">
            <button
              onClick={() => onBackToList?.()}
              className="flex items-center gap-1.5 text-[#222222] hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] rounded-full px-4 py-2 -mx-4"
              aria-label="חזרה לרשימה"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#059669] rotate-180"><path d="m15 18-6-6 6-6"/></svg>
              <span className="font-bold text-[15px]">חזרה</span>
            </button>
          </div>
          {/* Detail content */}
          <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
             {/* Large photo */}
             <div className="w-full h-56 rounded-2xl overflow-hidden mb-5 bg-slate-100 shadow-sm relative isolate">
               {selectedBusiness.photos?.[0] ? (
                 <img src={selectedBusiness.photos[0].url} className="w-full h-full object-cover" alt={selectedBusiness.name} />
               ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#ECFDF5] via-[#D1FAE5] to-[#A7F3D0]">
                    <div className="h-12 w-12 rounded-2xl bg-[#059669] flex items-center justify-center shadow-md">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                 </div>
               )}
             </div>
             <h2 className="text-[28px] font-extrabold mb-1.5 text-[#222222] tracking-tight">{selectedBusiness.name}</h2>
             <p className="text-[15px] font-medium text-[#717171] mb-6">{selectedBusiness.address}</p>
             <StatusCard business={selectedBusiness} schedule={selectedBusiness.today_schedule ?? null} />
          </div>
        </div>
      );
    }
  }

  const openCount = filtered.filter((b) => isOpenNow(b.today_schedule ?? null)).length;

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-5 py-3.5 border-b border-[#EBEBEB] bg-white flex-shrink-0 flex items-center gap-2.5">
        {loading ? (
          <div className="h-4 w-28 rounded-full shimmer" aria-hidden="true" />
        ) : (
          <>
            <p className="text-sm font-semibold text-[#222222]">
              {filtered.length > 0 ? `${filtered.length} עסקים` : "לא נמצאו עסקים"}
            </p>
            {openCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#D1FAE5]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#059669]" aria-hidden="true" />
                {openCount} פתוחים עכשיו
              </span>
            )}
          </>
        )}
      </div>

      {/* ── Scrollable cards ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-white scrollbar-thin">
        {loading ? (
          // Show 6 shimmer skeleton cards while data loads
          Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center py-16">
            <div className="h-14 w-14 rounded-full bg-[#ECFDF5] flex items-center justify-center">
              <MapPin className="h-7 w-7 text-[#059669]" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[#222222] font-semibold text-sm mb-1">
                לא נמצאו עסקים
              </p>
              <p className="text-[#717171] text-xs leading-relaxed">
                נסו לשנות את הפילטרים
                <br />
                או לגלול למיקום אחר במפה
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 p-4 lg:p-6 pb-24">
            {filtered.map((b, index) => (
              <div key={b.id} className={`h-full fade-in-up stagger-${(index % 6) + 1}`}>
                <BusinessCard
                  business={b}
                  isSelected={selectedBusinessId === b.id}
                  isHovered={hoveredBusinessId === b.id}
                  scrollRef={cardRefs.current.get(b.id)}
                  onClick={() => onBusinessSelect(b)}
                  onMouseEnter={() => onBusinessHover?.(b.id)}
                  onMouseLeave={() => onBusinessHover?.(null)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
