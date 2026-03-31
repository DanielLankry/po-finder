"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Map as MapIcon, List, Heart } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import FilterBar from "@/components/filters/FilterBar";
import FilterDrawer, { type FilterState } from "@/components/filters/FilterDrawer";
import BusinessListPanel from "@/components/business/BusinessListPanel";
import FavoritesPanel from "@/components/business/FavoritesPanel";
import { useFavorites } from "@/lib/hooks/useFavorites";
import type { BusinessCategory, BusinessSchedule, WeeklyScheduleEntry, BusinessWithSchedule, Photo } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import type { LocationResult } from "@/components/map/PlacesSearchBar";
import { isOpenNow } from "@/lib/utils/schedule";

const BusinessMap = dynamic(() => import("@/components/map/BusinessMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#FAFAF7]">
      <div className="h-10 w-10 rounded-full border-4 border-[#D1FAE5] border-t-[#059669] animate-spin" />
    </div>
  ),
});

const NAVBAR_H = 72;
const FILTERBAR_H = 64;
const MOBILE_SEARCH_H = 52; // extra search row on mobile
const CONTENT_TOP = NAVBAR_H + FILTERBAR_H;
const CONTENT_TOP_MOBILE = NAVBAR_H + FILTERBAR_H + MOBILE_SEARCH_H;

export default function MapPage() {
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
  const [searchQuery, setSearchQuery] = useState("");
  const { favorites, toggle: toggleFavorite, count: favCount } = useFavorites();

  useEffect(() => {
    const supabase = createClient();
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jerusalem" }));
    const today = now.toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });
    const todayDow = now.getDay(); // 0=Sun, 6=Sat

    async function fetchBusinesses() {
      const [{ data: bizData }, { data: schedData }, { data: weeklyData }] = await Promise.all([
        supabase.from("businesses").select("*, photos(*)").eq("is_active", true),
        supabase.from("business_schedules").select("*").eq("date", today),
        supabase.from("business_weekly_schedule").select("*").eq("day_of_week", todayDow).eq("is_active", true),
      ]);

      // Daily overrides take priority; weekly template is fallback
      const dailyMap = new Map(
        (schedData as BusinessSchedule[] ?? []).map((s) => [s.business_id, s])
      );
      const weeklyMap = new Map(
        (weeklyData as WeeklyScheduleEntry[] ?? []).map((w) => [w.business_id, w])
      );

      setBusinesses(
        (bizData ?? []).map((b) => {
          const daily = dailyMap.get(b.id);
          const weekly = weeklyMap.get(b.id);
          // Convert weekly entry to schedule-like object if no daily override
          const todaySchedule: BusinessSchedule | null = daily ?? (weekly ? {
            id: weekly.id,
            business_id: weekly.business_id,
            date: today,
            address: weekly.address,
            lat: weekly.lat,
            lng: weekly.lng,
            open_time: weekly.open_time,
            close_time: weekly.close_time,
            note: weekly.note,
            created_at: weekly.created_at,
          } : null);

          return {
            ...b,
            photos: (b.photos ?? []) as Photo[],
            today_schedule: todaySchedule,
          };
        })
      );
      setLoading(false);

    }

    fetchBusinesses();
  }, []);

  // Count businesses open now
  const openCount = businesses.filter((b) => isOpenNow(b.today_schedule ?? null)).length;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#FAFAF7]" dir="rtl">
      {/* App purpose — visible text required by Google OAuth verification */}
      <div className="bg-[#ECFDF5] border-b border-[#A7F3D0] px-4 py-1.5 text-center text-xs text-[#065F46] font-medium" dir="rtl">
        <span className="font-bold">פה קרוב</span> — פלטפורמה לגילוי עסקים קטנים וניידים קרוב אליכם בזמן אמת
      </div>
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
        className="flex overflow-hidden md:mt-[136px] mt-[188px]"
        style={{ height: `calc(100vh - ${CONTENT_TOP}px)` }}
      >
        {/* List panel — right side (RTL start), 800px on desktop to support 2 grid columns, full on mobile */}
        <div
          className={`flex-shrink-0 border-l border-[#EBEBEB] overflow-hidden bg-[#FAFAF7]
            w-full md:w-[600px] lg:w-[840px]
            ${mobileView === "list" ? "flex flex-col" : "hidden md:flex md:flex-col"}`}
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

        {/* Map panel — fills remaining space, floats with rounded corners */}
        <div className={`flex-1 relative p-3 md:p-5 lg:p-6 ${mobileView === "map" ? "block" : "hidden md:block"}`}>
          {/* Live badge — open now count */}
          {openCount > 0 && (
            <div className="absolute top-6 left-6 z-20 fade-in-up">
              <div className="flex items-center gap-2 h-10 px-4 rounded-full bg-[#ECFDF5] text-[#059669] font-semibold text-sm shadow-md border border-[#A7F3D0]" dir="rtl">
                <span className="relative flex h-2 w-2 flex-shrink-0" aria-hidden="true">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#059669] opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#059669]" />
                </span>
                <span>🟢 {openCount} עסקים פתוחים עכשיו</span>
              </div>
            </div>
          )}
          <div className="w-full h-full rounded-[24px] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-black/[0.04]" dir="ltr">
          <BusinessMap
            businesses={businesses}
            activeCategory={activeCategory}
            filters={filters}
            selectedBusinessId={selectedBusinessId}
            onBusinessSelect={(b) => setSelectedBusinessId(b.id)}
            externalHoveredId={hoveredBusinessId}
            onBusinessHover={(id) => setHoveredBusinessId(id)}
            searchCenter={searchCenter}
            onUserLocationChange={setUserLocation}
          />
          </div>
        </div>
      </div>

      {/* Privacy footer bar */}
      <div className="fixed bottom-0 inset-x-0 z-10 pointer-events-none flex justify-center pb-1.5">
        <div className="pointer-events-auto flex items-center gap-3 bg-white/85 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-sm border border-black/5 text-[11px] text-[#888]">
          <strong className="text-[#555]">פה קרוב</strong>
          <span> — פלטפורמה לגילוי עסקים ניידים בישראל</span>
          <span className="w-px h-3 bg-[#DDD]" />
          <a href="/privacy" className="hover:text-[#1d938d] transition-colors">פרטיות</a>
          <span className="w-px h-3 bg-[#DDD]" />
          <a href="/terms" className="hover:text-[#1d938d] transition-colors">תנאי שימוש</a>
        </div>
      </div>

      {/* Mobile floating toggle */}
      <div className="md:hidden fixed bottom-14 inset-x-0 z-20 flex justify-center pointer-events-none fade-in-up stagger-2">
        <button
          onClick={() => setMobileView((v) => (v === "list" ? "map" : "list"))}
          className="pointer-events-auto flex items-center gap-2.5 h-12 px-6 rounded-full bg-black/85 backdrop-blur-xl text-white font-bold text-[15px] shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10 hover:bg-black hover:scale-105 transition-all duration-300 active:scale-95"
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
