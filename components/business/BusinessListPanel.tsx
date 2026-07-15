"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { NumberTicker } from "@/components/ui/number-ticker";
import { CheckCircle2, ChevronRight, MapPin, RefreshCw, Star, Search, X } from "lucide-react";
import type { BusinessWithSchedule } from "@/lib/types";
import { CATEGORY_LABELS, KASHRUT_LABELS } from "@/lib/types";
import { getBusinessAvailability } from "@/lib/utils/schedule";
import BusinessCard from "./BusinessCard";
import StatusCard from "./StatusCard";
import ReviewForm from "./ReviewForm";
import ReviewsList from "./ReviewsList";
import SafeBusinessImage from "./SafeBusinessImage";
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
  selectedBusinessId: string | null;
  onBusinessSelect: (b: BusinessWithSchedule) => void;
  onBackToList?: () => void;
  hoveredBusinessId?: string | null;
  onBusinessHover?: (id: string | null) => void;
  loading?: boolean;
  userLocation?: { lat: number; lng: number } | null;
  favoriteIds?: Set<string>;
  onFavoriteToggle?: (id: string) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  error?: string | null;
  onRetry?: () => void;
}

/** Calculates straight-line distance for optional nearest-first sorting. */
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
      className="flex gap-3 px-5 py-4 border-b border-[#E7E1D3] border-r-[3px] border-r-transparent"
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
  selectedBusinessId,
  onBusinessSelect,
  onBackToList,
  hoveredBusinessId,
  onBusinessHover,
  loading = false,
  userLocation,
  favoriteIds,
  onFavoriteToggle,
  searchValue,
  onSearchChange,
  error,
  onRetry,
}: BusinessListPanelProps) {
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const detailScrollRef = useRef<HTMLDivElement>(null);
  const [panelReviews, setPanelReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const filtered = businesses
    .slice()
    .sort((a, b) => {
      if (!userLocation) return 0;
      const latA = a.today_schedule?.lat ?? a.lat;
      const lngA = a.today_schedule?.lng ?? a.lng;
      const latB = b.today_schedule?.lat ?? b.lat;
      const lngB = b.today_schedule?.lng ?? b.lng;
      const dA = latA != null && lngA != null ? getDistanceKm(userLocation.lat, userLocation.lng, latA, lngA) : Infinity;
      const dB = latB != null && lngB != null ? getDistanceKm(userLocation.lat, userLocation.lng, latB, lngB) : Infinity;
      return dA - dB;
    });

  const setCardRef = useCallback((businessId: string, node: HTMLDivElement | null) => {
    if (node) {
      cardRefs.current.set(businessId, node);
    } else {
      cardRefs.current.delete(businessId);
    }
  }, []);

  // Fetch reviews when a business is selected
  useEffect(() => {
    if (!selectedBusinessId) return;
    let cancelled = false;
    const loadingTimer = setTimeout(() => {
      if (!cancelled) setReviewsLoading(true);
    }, 0);

    fetch(`/api/reviews?businessId=${selectedBusinessId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setPanelReviews(data.reviews ?? []);
      })
      .catch(() => {
        if (!cancelled) setPanelReviews([]);
      })
      .finally(() => {
        if (!cancelled) setReviewsLoading(false);
      });

    return () => {
      cancelled = true;
      clearTimeout(loadingTimer);
    };
  }, [selectedBusinessId]);

  // Scroll selected card into view when selection changes (e.g. pin clicked on map)
  useEffect(() => {
    if (!selectedBusinessId) return;
    const node = cardRefs.current.get(selectedBusinessId);
    node?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedBusinessId]);

  // A newly selected business always starts at its summary, not at the scroll
  // position left behind by the previous business.
  useEffect(() => {
    if (!selectedBusinessId) return;
    const frame = window.requestAnimationFrame(() => {
      detailScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selectedBusinessId]);

  if (selectedBusinessId && !loading) {
    const selectedBusiness = businesses.find((b) => b.id === selectedBusinessId);
    if (selectedBusiness) {
      const primaryPhoto =
        selectedBusiness.photos?.find((photo) => photo.is_primary) ?? selectedBusiness.photos?.[0];
      const selectedAvailability = getBusinessAvailability(selectedBusiness);

      return (
        <div className="brand-canvas flex h-full min-h-0 flex-col" dir="rtl">
          <div className="z-10 flex shrink-0 items-center justify-between border-b-2 border-[#17402D]/20 bg-[#F7F3EA]/95 px-4 py-3 backdrop-blur-sm lg:px-6">
            <button
              type="button"
              onClick={() => onBackToList?.()}
              className="business-type-button flex min-h-10 items-center gap-1.5 px-4 text-sm font-black"
              aria-label="חזרה לרשימה"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
              חזרה לעסקים
            </button>
            <span className="font-display text-xl text-[#17402D]">כרטיס עסק</span>
          </div>

          <div
            ref={detailScrollRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-thin"
            data-testid="business-detail-scroll"
          >
            <div className="mx-auto max-w-[800px] p-4 pb-28 lg:p-6 lg:pb-28">
              <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1.08fr)_minmax(300px,0.92fr)]">
                <div className="space-y-5">
                  <section className="brand-panel overflow-hidden bg-[#FFFDF7]">
                    <div className="relative h-48 border-b-2 border-[#17402D] bg-[#DDEBE0] lg:h-52">
                      <SafeBusinessImage
                        src={primaryPhoto?.url}
                        alt={`תמונה של ${selectedBusiness.name}`}
                        category={selectedBusiness.category}
                        className="h-full w-full object-cover"
                        loading="eager"
                      />
                      <span
                        className={`absolute bottom-3 right-3 rounded-full border-2 px-3 py-1 text-xs font-black shadow-[2px_2px_0_0_#17402D] ${
                          selectedAvailability === "open"
                            ? "border-[#17402D] bg-[#DDEBE0] text-[#17402D]"
                            : "border-[#8A3618] bg-[#F7E7DE] text-[#8A3618]"
                        }`}
                      >
                        {selectedAvailability === "open"
                          ? "פתוח עכשיו"
                          : "שעות הפעילות לא ידועות"}
                      </span>
                    </div>

                    <div className="space-y-4 p-5">
                      <div>
                        <h2 className="font-display text-3xl text-[#17402D]">{selectedBusiness.name}</h2>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {selectedBusiness.avg_rating > 0 && (
                            <span className="inline-flex items-center gap-1 text-sm font-black text-[#17402D]">
                              <Star className="h-4 w-4 fill-[#F4B942] text-[#8A3618]" aria-hidden="true" />
                              {selectedBusiness.avg_rating.toFixed(1)}
                              <span className="font-normal text-[#17402D]/55">
                                ({selectedBusiness.review_count} ביקורות)
                              </span>
                            </span>
                          )}
                          <span
                            className="brand-chip px-3 py-1 text-xs"
                            style={{
                              backgroundColor: CATEGORY_CHIP[selectedBusiness.category]?.bg ?? "#FFF8DC",
                              color: CATEGORY_CHIP[selectedBusiness.category]?.text ?? "#17402D",
                            }}
                          >
                            {CATEGORY_LABELS[selectedBusiness.category]}
                          </span>
                          {selectedBusiness.kashrut !== "none" && (
                            <span className="rounded-full border-2 border-[#17402D]/25 bg-[#DDEBE0] px-3 py-1 text-xs font-black text-[#17402D]">
                              {KASHRUT_LABELS[selectedBusiness.kashrut]}
                            </span>
                          )}
                          {selectedBusiness.is_verified && (
                            <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#5D3A9B]/30 bg-[#F0EAFE] px-3 py-1 text-xs font-black text-[#5D3A9B]">
                              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                              מאומת
                            </span>
                          )}
                        </div>
                      </div>

                      {selectedBusiness.description && (
                        <>
                          <div className="brand-rule" aria-hidden="true" />
                          <p className="text-sm leading-relaxed text-[#17402D]/75">
                            {selectedBusiness.description}
                          </p>
                        </>
                      )}
                    </div>
                  </section>
                </div>

                <StatusCard
                  business={selectedBusiness}
                  schedule={selectedBusiness.today_schedule ?? null}
                  hoursStatus={selectedBusiness.hours_status}
                />
              </div>

              <section className="brand-panel-soft mt-5 bg-[#FFFDF7] p-5 lg:p-6">
                <div className="mb-5 flex items-end justify-between gap-3 border-b-2 border-[#17402D]/15 pb-3">
                  <h3 className="font-display text-2xl text-[#17402D]">ביקורות מהשכונה</h3>
                  <span className="text-xs font-bold text-[#17402D]/55">
                    {panelReviews.length > 0 ? `${panelReviews.length} ביקורות` : "היו הראשונים"}
                  </span>
                </div>
                {reviewsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#DDEBE0] border-t-[#2D6A4F]" />
                  </div>
                ) : (
                  <>
                    <ReviewsList reviews={panelReviews} />
                    {panelReviews.length > 0 && <div className="brand-rule my-5" aria-hidden="true" />}
                    <ReviewForm
                      businessId={selectedBusiness.id}
                      onSuccess={() => {
                        fetch(`/api/reviews?businessId=${selectedBusiness.id}`)
                          .then((response) => response.json())
                          .then((data) => setPanelReviews(data.reviews ?? []));
                      }}
                    />
                  </>
                )}
              </section>
            </div>
          </div>
        </div>
      );
    }
  }

  const openCount = filtered.filter(
    (business) => getBusinessAvailability(business) === "open",
  ).length;

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4 border-b-2 border-[#17402D]/10 bg-[#F7F3EA] flex-shrink-0">
        {/* Search input */}
        <div className="relative mb-3">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#17402D]/60 pointer-events-none" />
          <input
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="חפש עסק, שכונה, מוצר..."
            className="w-full h-11 rounded-xl border-2 border-[#17402D]/20 bg-white ps-9 pe-12 text-base md:text-sm font-medium text-[#17402D] placeholder:text-[#17402D]/40 shadow-[2px_2px_0_0_rgba(23,64,45,0.12)] focus:outline-none focus:border-[#17402D] focus:shadow-[3px_3px_0_0_#17402D] transition-all"
            dir="rtl"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute end-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-[#17402D]/50 transition-colors hover:text-[#C4552D]"
              aria-label="ניקוי חיפוש עסקים"
            >
              <X className="h-4 w-4" aria-hidden="true" />
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
              <p className="font-display text-2xl text-[#17402D] flex items-baseline gap-1.5">
                <NumberTicker value={filtered.length} className="font-display text-2xl text-[#17402D]" />
                <span>עסקים</span>
              </p>
            ) : (
              <p className="font-display text-2xl text-[#17402D]">לא נמצאו עסקים זמינים כרגע</p>
            )}
            {openCount > 0 && (
              <span className="inline-flex items-center gap-2 text-sm font-bold px-3.5 py-1.5 rounded-full bg-white text-[#1F5038] border-2 border-[#17402D] shadow-[2px_2px_0_0_#17402D]">
                <span className="relative flex h-2 w-2 flex-shrink-0" aria-hidden="true">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2D6A4F] opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2D6A4F]" />
                </span>
                <NumberTicker value={openCount} className="text-sm font-bold text-[#1F5038]" />
                <span>פתוחים עכשיו</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Scrollable cards ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-[#F7F3EA] scrollbar-thin">
        {loading ? (
          // Show 6 shimmer skeleton cards while data loads
          Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-8 py-16 text-center">
            <div className="brand-panel-soft max-w-sm p-5">
              <p className="text-sm font-bold text-[#8A3618]" role="alert">{error}</p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="business-type-button mx-auto mt-4 flex min-h-11 items-center gap-2 px-5 text-sm font-black"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  נסו שוב
                </button>
              )}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center py-16">
            <div className="h-14 w-14 rounded-full bg-[#EFF5F0] flex items-center justify-center">
              <MapPin className="h-7 w-7 text-[#2D6A4F]" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[#222222] font-semibold text-sm mb-1">
                לא נמצאו עסקים זמינים כרגע
              </p>
              <p className="text-[#717171] text-xs leading-relaxed">
                נסו לשנות את הפילטרים
                <br />
                או לחזור מאוחר יותר
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 lg:p-6 pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filtered.map((business, index) => (
                <div
                  key={business.id}
                  className={`h-full fade-in-up stagger-${(index % 6) + 1}`}
                >
                  <BusinessCard
                    business={business}
                    isSelected={selectedBusinessId === business.id}
                    isHovered={hoveredBusinessId === business.id}
                    isFavorited={favoriteIds?.has(business.id)}
                    scrollRef={(node) => setCardRef(business.id, node)}
                    onClick={() => onBusinessSelect(business)}
                    onMouseEnter={() => onBusinessHover?.(business.id)}
                    onMouseLeave={() => onBusinessHover?.(null)}
                    onFavoriteToggle={() => onFavoriteToggle?.(business.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
