"use client";

import { useRef, useEffect, createRef, useState } from "react";
import { NumberTicker } from "@/components/ui/number-ticker";
import { MapPin, Star, Search, X } from "lucide-react";
import type { BusinessWithSchedule, BusinessCategory } from "@/lib/types";
import { CATEGORY_LABELS, KASHRUT_LABELS } from "@/lib/types";
import type { FilterState } from "@/components/filters/FilterDrawer";
import { isOpenNow } from "@/lib/utils/schedule";
import BusinessCard from "./BusinessCard";
import StatusCard from "./StatusCard";
import ReviewForm from "./ReviewForm";
import ReviewsList from "./ReviewsList";
import type { Review } from "@/lib/types";

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
  favoriteIds?: Set<string>;
  onFavoriteToggle?: (id: string) => void;
  searchQuery?: string;
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
  favoriteIds,
  onFavoriteToggle,
  searchQuery = "",
}: BusinessListPanelProps) {
  const cardRefs = useRef<Map<string, React.RefObject<HTMLDivElement | null>>>(new Map());
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [panelReviews, setPanelReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const q = localSearch.trim().toLowerCase();
  const filtered = businesses
    .filter((b) => {
      if (activeCategory !== "all" && b.category !== activeCategory) return false;
      if (filters.kashrut !== "all" && b.kashrut !== filters.kashrut) return false;
      if (filters.minRating > 0 && b.avg_rating < filters.minRating) return false;
      if (filters.openNow && !isOpenNow(b.today_schedule ?? null)) return false;
      if (q) {
        const haystack = [b.name, b.description, b.address, b.today_schedule?.address]
          .filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
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

  // Fetch reviews when a business is selected
  useEffect(() => {
    if (!selectedBusinessId) {
      setPanelReviews([]);
      return;
    }
    setReviewsLoading(true);
    fetch(`/api/reviews?businessId=${selectedBusinessId}`)
      .then((r) => r.json())
      .then((data) => setPanelReviews(data.reviews ?? []))
      .catch(() => setPanelReviews([]))
      .finally(() => setReviewsLoading(false));
  }, [selectedBusinessId]);

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
          <div className="px-5 py-3.5 border-b border-t border-[#EBEBEB] bg-[#FAFAF7] flex items-center shrink-0 sticky top-0 z-10">
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
             <h2 className="text-[26px] font-extrabold mb-1 text-[#111111] tracking-tight">{selectedBusiness.name}</h2>

             {/* Rating + category row */}
             <div className="flex items-center gap-2 flex-wrap mb-3">
               {selectedBusiness.avg_rating > 0 && (
                 <span className="flex items-center gap-1 text-[13px] font-bold text-[#222222]">
                   <Star className="h-3.5 w-3.5 fill-[#222222]" />
                   {selectedBusiness.avg_rating.toFixed(1)}
                   <span className="font-normal text-[#888888]">({selectedBusiness.review_count})</span>
                 </span>
               )}
               {selectedBusiness.avg_rating > 0 && <span className="text-[#DDDDDD]">·</span>}
               <span className="text-[13px] font-semibold px-2.5 py-0.5 rounded-full"
                 style={{ backgroundColor: CATEGORY_CHIP[selectedBusiness.category]?.bg ?? "#F3F4F6", color: CATEGORY_CHIP[selectedBusiness.category]?.text ?? "#374151" }}>
                 {CATEGORY_LABELS[selectedBusiness.category]}
               </span>
               {selectedBusiness.kashrut !== "none" && (
                 <span className="text-[13px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                   {KASHRUT_LABELS[selectedBusiness.kashrut]}
                 </span>
               )}
               {selectedBusiness.business_number && (
                 <span className="text-[12px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                   ✓ מאומת
                 </span>
               )}
             </div>

             {/* Description */}
             {selectedBusiness.description && (
               <p className="text-[14px] text-[#555555] leading-relaxed mb-4 border-b border-[#F0F0EC] pb-4">
                 {selectedBusiness.description}
               </p>
             )}

             <StatusCard business={selectedBusiness} schedule={selectedBusiness.today_schedule ?? null} />

             {/* Reviews section */}
             <div className="mt-5 border-t border-[#F0F0EC] pt-5">
               <h3 className="font-bold text-[16px] text-[#111111] mb-4">ביקורות</h3>
               {reviewsLoading ? (
                 <div className="flex items-center justify-center py-6">
                   <div className="h-6 w-6 rounded-full border-2 border-[#D1FAE5] border-t-[#059669] animate-spin" />
                 </div>
               ) : (
                 <>
                   <ReviewsList reviews={panelReviews} />
                   {panelReviews.length > 0 && <hr className="border-[#F0F0EC] my-4" />}
                   <ReviewForm
                     businessId={selectedBusiness.id}
                     onSuccess={() => {
                       // Refresh reviews after submit
                       fetch(`/api/reviews?businessId=${selectedBusiness.id}`)
                         .then((r) => r.json())
                         .then((data) => setPanelReviews(data.reviews ?? []));
                     }}
                   />
                 </>
               )}
             </div>
          </div>
        </div>
      );
    }
  }

  const openCount = filtered.filter((b) => isOpenNow(b.today_schedule ?? null)).length;

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4 border-b border-[#EBEBEB] bg-white flex-shrink-0 shadow-sm">
        {/* Search input */}
        <div className="relative mb-3">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#AAA] pointer-events-none" />
          <input
            type="search"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="חפש עסק, שכונה, מוצר..."
            className="w-full h-10 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] pr-9 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent transition-all"
            dir="rtl"
          />
          {localSearch && (
            <button
              onClick={() => setLocalSearch("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AAA] hover:text-[#555] transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {loading ? (
          <div className="flex items-center gap-3">
            <div className="h-7 w-20 rounded-lg shimmer" aria-hidden="true" />
            <div className="h-6 w-32 rounded-full shimmer" aria-hidden="true" />
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            {filtered.length > 0 ? (
              <p className="text-xl font-bold text-[#111111] tracking-tight flex items-baseline gap-1">
                <NumberTicker value={filtered.length} className="text-xl font-bold text-[#111111]" />
                <span>עסקים</span>
              </p>
            ) : (
              <p className="text-xl font-bold text-[#111111] tracking-tight">לא נמצאו עסקים</p>
            )}
            {openCount > 0 && (
              <span className="inline-flex items-center gap-2 text-sm font-semibold px-3.5 py-1.5 rounded-full bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                <span className="relative flex h-2 w-2 flex-shrink-0" aria-hidden="true">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#059669] opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#059669]" />
                </span>
                <NumberTicker value={openCount} className="text-sm font-semibold text-[#047857]" />
                <span>פתוחים עכשיו</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Scrollable cards ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-[#FAFAF7] scrollbar-thin">
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
                  isFavorited={favoriteIds?.has(b.id)}
                  scrollRef={cardRefs.current.get(b.id)}
                  onClick={() => onBusinessSelect(b)}
                  onMouseEnter={() => onBusinessHover?.(b.id)}
                  onMouseLeave={() => onBusinessHover?.(null)}
                  onFavoriteToggle={() => onFavoriteToggle?.(b.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
