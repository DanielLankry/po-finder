"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Map as MapIcon, List } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import FilterBar from "@/components/filters/FilterBar";
import FilterDrawer, { type FilterState } from "@/components/filters/FilterDrawer";
import BusinessListPanel from "@/components/business/BusinessListPanel";
import FavoritesPanel from "@/components/business/FavoritesPanel";
import { useFavorites } from "@/lib/hooks/useFavorites";
import type { BusinessCategory, BusinessWithSchedule } from "@/lib/types";
import type { LocationResult } from "@/components/map/PlacesSearchBar";
import { isOpenNow } from "@/lib/utils/schedule";

const BusinessMap = dynamic(() => import("@/components/map/BusinessMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#F7F3EA]">
      <div className="h-10 w-10 rounded-full border-4 border-[#DDEBE0] border-t-[#2D6A4F] animate-spin" />
    </div>
  ),
});

export default function MapPage() {
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<BusinessCategory | "all">("all");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ kashrut: "all", minRating: 0, openNow: false });
  const [businesses, setBusinesses] = useState<BusinessWithSchedule[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [hoveredBusinessId, setHoveredBusinessId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [searchCenter, setSearchCenter] = useState<LocationResult | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [favoritesPanelOpen, setFavoritesPanelOpen] = useState(false);
  const searchQuery = searchParams.get("q")?.slice(0, 120) ?? "";
  const { favorites, toggle: toggleFavorite, count: favCount } = useFavorites();

  useEffect(() => {
    async function fetchBusinesses() {
      try {
        const response = await fetch("/api/businesses?includeSchedule=1", {
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json() as { businesses?: BusinessWithSchedule[] };
        setBusinesses(data.businesses ?? []);
      } catch (error) {
        console.error("Failed to load public businesses:", error);
        setBusinesses([]);
      } finally {
        setLoading(false);
      }
    }

    fetchBusinesses();
  }, []);

  // Count businesses open now
  const openCount = businesses.filter((b) => isOpenNow(b.today_schedule ?? null)).length;

  return (
    <div className="brand-canvas ambient-motion h-[100dvh] min-h-[520px] flex flex-col overflow-hidden" dir="rtl">
      <Navbar
        onLocationSelect={(loc) => {
          setSearchCenter(loc);
          setMobileView("map");
        }}
        favCount={favCount}
        onFavoritesOpen={() => setFavoritesPanelOpen(true)}
      />

      <FilterBar
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        onFilterOpen={() => setFilterDrawerOpen(true)}
        onLocationSelect={(loc) => {
          setSearchCenter(loc);
          setMobileView("map");
        }}
      />

      {/* Main split content */}
      <div
        className="flex overflow-hidden mt-[calc(72px+var(--public-filter-height,116px))] h-[calc(100dvh-72px-var(--public-filter-height,116px))]"
      >
        {/* List panel — single-view below 1440px, right side in wide desktop split view */}
        <div
          className={`flex-shrink-0 border-l-2 border-[#17402D]/10 overflow-hidden bg-[#F7F3EA]
            w-full min-[1440px]:w-[820px]
            ${mobileView === "list" ? "flex flex-col" : "hidden min-[1440px]:flex min-[1440px]:flex-col"}`}
        >
          <BusinessListPanel
            businesses={businesses}
            activeCategory={activeCategory}
            filters={filters}
            selectedBusinessId={selectedBusinessId}
            onBusinessSelect={(b) => setSelectedBusinessId(b.id)}
            onBackToList={() => setSelectedBusinessId(null)}
            hoveredBusinessId={hoveredBusinessId}
            onBusinessHover={(id) => setHoveredBusinessId(id)}
            loading={loading}
            userLocation={userLocation}
            favoriteIds={favorites}
            onFavoriteToggle={toggleFavorite}
            searchQuery={searchQuery}
          />
        </div>

        {/* Map panel — single-view below 1440px, fills remaining space in wide desktop split view */}
        <div className={`flex-1 relative p-3 md:p-5 min-[1440px]:p-6 ${mobileView === "map" ? "block" : "hidden min-[1440px]:block"}`}>
          {/* Live badge — open now count */}
          {openCount > 0 && (
            <div className="absolute top-6 left-6 z-20 fade-in-up">
              <div className="flex items-center gap-2 h-10 px-4 rounded-full bg-white text-[#17402D] font-bold text-sm border-2 border-[#17402D] shadow-[3px_3px_0_0_#17402D]" dir="rtl">
                <span className="relative flex h-2 w-2 flex-shrink-0" aria-hidden="true">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2D6A4F] opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2D6A4F]" />
                </span>
                <span>{openCount} עסקים פתוחים עכשיו</span>
              </div>
            </div>
          )}
          <div className="w-full h-full rounded-[24px] overflow-hidden border-2 border-[#17402D]/15 shadow-[6px_6px_0_0_rgba(23,64,45,0.12)]" dir="ltr">
          <BusinessMap
            businesses={businesses}
            activeCategory={activeCategory}
            filters={filters}
            selectedBusinessId={selectedBusinessId}
            onBusinessSelect={(b) => setSelectedBusinessId(b.id)}
            onBusinessClear={() => setSelectedBusinessId(null)}
            externalHoveredId={hoveredBusinessId}
            onBusinessHover={(id) => setHoveredBusinessId(id)}
            searchCenter={searchCenter}
            onUserLocationChange={setUserLocation}
          />
          </div>
        </div>
      </div>

      {/* Privacy footer bar */}
      <div className="fixed bottom-0 inset-x-0 z-10 pointer-events-none flex justify-center pb-[max(0.375rem,env(safe-area-inset-bottom))] px-2">
        <div className="pointer-events-auto flex max-w-full items-center gap-2 overflow-hidden rounded-full border-2 border-[#17402D]/15 bg-white/90 px-3 py-1.5 text-[11px] text-[#666] shadow-sm backdrop-blur-sm sm:gap-3 sm:px-4">
          <strong className="text-[#555]">פה קרוב</strong>
          <span className="truncate"> — עסקים קטנים וניידים קרוב אליכם</span>
          <span className="w-px h-3 bg-[#DDD]" />
          <a href="/privacy" className="shrink-0 hover:text-[#1F5038] transition-colors">פרטיות</a>
          <span className="w-px h-3 bg-[#DDD]" />
          <a href="/terms" className="hidden shrink-0 hover:text-[#1F5038] transition-colors xs:inline">תנאים</a>
        </div>
      </div>

      {/* Mobile floating toggle */}
      <div className="min-[1440px]:hidden fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] inset-x-0 z-20 flex justify-center pointer-events-none fade-in-up stagger-2">
        <button
          onClick={() => setMobileView((v) => (v === "list" ? "map" : "list"))}
          className="pointer-events-auto flex items-center gap-2.5 h-12 px-6 rounded-full bg-[#17402D] text-[#F7F3EA] font-bold text-[15px] border-2 border-[#F7F3EA]/25 shadow-[4px_4px_0_0_rgba(23,64,45,0.35)] hover:scale-105 transition-all duration-300 active:scale-95"
          aria-label={mobileView === "list" ? "עבור למפה" : "עבור לרשימה"}
        >
          {mobileView === "list" ? (
            <><MapIcon className="h-[18px] w-[18px]" aria-hidden="true" /> מפה</>
          ) : (
            <><List className="h-[18px] w-[18px]" aria-hidden="true" /> רשימה</>
          )}
        </button>
      </div>

      <FilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <FavoritesPanel
        open={favoritesPanelOpen}
        onClose={() => setFavoritesPanelOpen(false)}
        businesses={businesses}
        favoriteIds={favorites}
        onFavoriteToggle={toggleFavorite}
        onBusinessSelect={(b) => { setSelectedBusinessId(b.id); setMobileView("map"); }}
        selectedBusinessId={selectedBusinessId}
      />


    </div>
  );
}
