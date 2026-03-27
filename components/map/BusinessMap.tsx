"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  OverlayView,
} from "@react-google-maps/api";
import { warmMapStyle, TEL_AVIV_CENTER, DEFAULT_ZOOM } from "@/lib/maps/mapStyle";
import BusinessPopup from "./BusinessPopup";
import type { BusinessWithSchedule, BusinessCategory, Spot } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { isOpenNow } from "@/lib/utils/schedule";
import type { FilterState } from "../filters/FilterDrawer";
import { createClient } from "@/lib/supabase/client";

interface BusinessMapProps {
  businesses: BusinessWithSchedule[];
  activeCategory: BusinessCategory | "all";
  filters: FilterState;
  selectedBusinessId?: string | null;
  onBusinessSelect?: (b: BusinessWithSchedule) => void;
  externalHoveredId?: string | null;
  onBusinessHover?: (id: string | null) => void;
  searchCenter?: { lat: number; lng: number } | null;
  onUserLocationChange?: (loc: { lat: number; lng: number }) => void;
}



const MAP_CONTAINER_STYLE = {
  width: "100%",
  height: "100%",
};

const libraries: ("places" | "geometry")[] = ["places"];

export default function BusinessMap({
  businesses,
  activeCategory,
  filters,
  selectedBusinessId,
  onBusinessSelect,
  externalHoveredId,
  onBusinessHover,
  searchCenter,
  onUserLocationChange,
}: BusinessMapProps) {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("spots")
      .select("*")
      .eq("is_approved", true)
      .gt("expires_at", new Date().toISOString())
      .then(({ data }) => setSpots((data ?? []) as Spot[]));
  }, []);

  const [selectedBusiness, setSelectedBusiness] =
    useState<BusinessWithSchedule | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
    language: "he",
    region: "IL",
  });

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          onUserLocationChange?.(loc);
        },
        () => {
          // Denied — use Tel Aviv default
        }
      );
    }
  }, []);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Pan map when card is clicked in the list panel
  useEffect(() => {
    if (!selectedBusinessId || !mapRef.current) return;
    const business = businesses.find((b) => b.id === selectedBusinessId);
    if (!business) return;
    const lat = business.today_schedule?.lat ?? business.lat;
    const lng = business.today_schedule?.lng ?? business.lng;
    if (lat && lng) {
      mapRef.current.panTo({ lat, lng });
      setSelectedBusiness(business);
    }
  }, [selectedBusinessId, businesses]);

  // Pan + zoom when a location is chosen from the search bar or GPS
  useEffect(() => {
    if (!searchCenter || !mapRef.current) return;
    mapRef.current.panTo({ lat: searchCenter.lat, lng: searchCenter.lng });
    mapRef.current.setZoom(15);
  }, [searchCenter]);

  // Filter businesses
  const visibleBusinesses = businesses.filter((b) => {
    if (activeCategory !== "all" && b.category !== activeCategory) return false;
    if (filters.kashrut !== "all" && b.kashrut !== filters.kashrut) return false;
    if (filters.minRating > 0 && b.avg_rating < filters.minRating) return false;
    if (filters.openNow && !isOpenNow(b.today_schedule ?? null)) return false;
    if (!b.lat || !b.lng) {
      const todaySchedule = b.today_schedule;
      if (!todaySchedule?.lat || !todaySchedule?.lng) return false;
    }
    return true;
  });

  if (loadError)
    return (
      <div className="flex items-center justify-center h-full text-stone-500">
        שגיאה בטעינת המפה
      </div>
    );

  if (!isLoaded)
    return (
      <div className="flex items-center justify-center h-full bg-surface">
        <div className="text-center">
          <div className="h-10 w-10 rounded-full border-4 border-[#D1FAE5] border-t-[#059669] animate-spin mx-auto mb-3" />
          <p className="text-stone-500 text-sm">טוען מפה...</p>
        </div>
      </div>
    );

  const center = userLocation ?? TEL_AVIV_CENTER;

  return (
    <GoogleMap
      mapContainerStyle={MAP_CONTAINER_STYLE}
      center={center}
      zoom={DEFAULT_ZOOM}
      options={{
        styles: warmMapStyle,
        disableDefaultUI: true,
        zoomControl: false,
        clickableIcons: false,
        gestureHandling: "greedy",
        keyboardShortcuts: false,
      }}
      onLoad={onMapLoad}
      onClick={() => setSelectedBusiness(null)}
    >
      {visibleBusinesses.map((business) => {
        const schedule = business.today_schedule;
        const lat = schedule?.lat ?? business.lat;
        const lng = schedule?.lng ?? business.lng;
        if (!lat || !lng) return null;

        const isSelected = selectedBusiness?.id === business.id;
        const internalHovered = hoveredId === business.id;
        const isHovered = internalHovered || externalHoveredId === business.id;
        const open = isOpenNow(schedule ?? null);

        const CATEGORY_EMOJI: Record<string, string> = {
          coffee:  "☕",
          food:    "🍽️",
          sweets:  "🍰",
          meat:    "🥩",
          vegan:   "🌿",
          celiac:  "🌾",
          flowers: "🌸",
          jewelry: "💎",
          vintage: "👗",
        };
        const emoji = CATEGORY_EMOJI[business.category] ?? "📍";

        const size = isSelected || isHovered ? 40 : 32;

        return (
          <OverlayView
            key={business.id}
            position={{ lat, lng }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            getPixelPositionOffset={() => ({ x: -(size / 2), y: -(size / 2) })}
          >
            <div
              style={{
                position: "relative",
                width: size,
                height: size,
                zIndex: isSelected || isHovered ? 20 : 10,
                filter: isSelected || isHovered
                  ? "drop-shadow(0 4px 12px rgba(0,0,0,0.25))"
                  : "drop-shadow(0 2px 4px rgba(0,0,0,0.12))",
                cursor: "pointer",
                userSelect: "none",
                transition: "width 0.2s, height 0.2s, filter 0.2s",
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedBusiness(business);
                onBusinessSelect?.(business);
              }}
              onMouseEnter={() => {
                setHoveredId(business.id);
                onBusinessHover?.(business.id);
              }}
              onMouseLeave={() => {
                setHoveredId(null);
                onBusinessHover?.(null);
              }}
              role="button"
              aria-label={`${business.name} — ${CATEGORY_LABELS[business.category]}`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedBusiness(business);
                }
              }}
            >
              <div
                style={{
                  width: size,
                  height: size,
                  fontSize: isSelected || isHovered ? "1.4rem" : "1.1rem",
                  border: `2px solid ${isSelected || isHovered ? "#059669" : "rgba(255,255,255,0.8)"}`,
                  opacity: open ? 1 : 0.5,
                  filter: open ? "none" : "grayscale(1)",
                }}
                className="flex items-center justify-center rounded-full bg-white shadow-md select-none transition-all duration-200"
              >
                {emoji}
              </div>

              {/* Popup for desktop */}
              {isSelected && !isMobile && (
                <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", zIndex: 30 }}>
                  <BusinessPopup
                    business={business}
                    onClose={() => setSelectedBusiness(null)}
                  />
                </div>
              )}
            </div>
          </OverlayView>
        );
      })}

      {/* ── Spot markers (amber/pulsing) ─────────────────────────── */}
      {spots.map((spot) => {
        const isSelected = selectedSpot?.id === spot.id;
        const size = isSelected ? 44 : 36;
        const CATEGORY_EMOJI: Record<string, string> = {
          coffee:"☕", food:"🍽️", sweets:"🍰", meat:"🥩",
          vegan:"🌿", celiac:"🌾", flowers:"🌸", jewelry:"💎", vintage:"👗",
        };
        const emoji = CATEGORY_EMOJI[spot.category] ?? "📍";

        return (
          <OverlayView
            key={`spot-${spot.id}`}
            position={{ lat: spot.lat, lng: spot.lng }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            getPixelPositionOffset={() => ({ x: -(size / 2), y: -(size / 2) })}
          >
            <div
              style={{ position: "relative", width: size, height: size, zIndex: 30, cursor: "pointer" }}
              onClick={(e) => { e.stopPropagation(); setSelectedSpot(isSelected ? null : spot); setSelectedBusiness(null); }}
            >
              {/* Pulse ring */}
              <div style={{
                position: "absolute", inset: -8,
                borderRadius: "50%",
                border: "2px solid rgba(245,158,11,0.5)",
                animation: "spot-pulse 2s ease-out infinite",
                pointerEvents: "none",
              }} />
              <div style={{
                position: "absolute", inset: -4,
                borderRadius: "50%",
                border: "2px solid rgba(245,158,11,0.3)",
                animation: "spot-pulse 2s ease-out 0.7s infinite",
                pointerEvents: "none",
              }} />

              {/* Main pin */}
              <div style={{
                width: size, height: size,
                fontSize: isSelected ? "1.5rem" : "1.2rem",
                border: "2.5px solid #f59e0b",
                background: "linear-gradient(135deg, #fef3c7, #fde68a)",
                boxShadow: "0 4px 12px rgba(245,158,11,0.45)",
              }} className="flex items-center justify-center rounded-full select-none transition-all duration-200">
                {emoji}
              </div>

              {/* SPOT badge */}
              <div style={{
                position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                color: "white", fontSize: "9px", fontWeight: 800,
                padding: "1px 5px", borderRadius: "999px",
                whiteSpace: "nowrap", pointerEvents: "none",
                boxShadow: "0 2px 6px rgba(245,158,11,0.5)",
              }}>
                SPOT
              </div>

              {/* Popup on select */}
              {isSelected && !isMobile && (
                <div style={{ position: "absolute", bottom: "calc(100% + 12px)", left: "50%", transform: "translateX(-50%)", zIndex: 40 }}>
                  <div dir="rtl" style={{
                    background: "white", borderRadius: 16, padding: 14,
                    boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
                    border: "1.5px solid #fde68a",
                    minWidth: 200, maxWidth: 260,
                  }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{emoji}</span>
                      <p className="font-bold text-[#111] text-sm">{spot.name}</p>
                    </div>
                    {spot.description && <p className="text-xs text-[#666] mb-1">{spot.description}</p>}
                    <p className="text-xs text-[#888] flex items-center gap-1">📍 {spot.address}</p>
                    {spot.phone && <p className="text-xs text-[#888] mt-0.5">📞 {spot.phone}</p>}
                    <div className="mt-2 pt-2 border-t border-[#FEF3C7] flex items-center gap-1">
                      <span style={{ background:"linear-gradient(135deg,#f59e0b,#d97706)", color:"white", fontSize:"10px", fontWeight:700, padding:"2px 8px", borderRadius:999 }}>SPOT</span>
                      <span className="text-[10px] text-amber-600 font-medium">
                        {(() => { const h = Math.floor((new Date(spot.expires_at).getTime()-Date.now())/3600000); return h<24?`נגמר בעוד ${h}ש`:`${Math.floor(h/24)} ימים`; })()}
                      </span>
                    </div>
                  </div>
                  {/* Arrow */}
                  <div style={{ width:0, height:0, borderLeft:"8px solid transparent", borderRight:"8px solid transparent", borderTop:"8px solid white", margin:"0 auto", filter:"drop-shadow(0 2px 2px rgba(0,0,0,0.1))" }} />
                </div>
              )}
            </div>
          </OverlayView>
        );
      })}

      <style>{`
        @keyframes spot-pulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>

      {/* User location dot */}
      {userLocation && (
        <OverlayView
          position={userLocation}
          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          getPixelPositionOffset={() => ({ x: -12, y: -12 })}
        >
          <div style={{ position: "relative", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <style>{`
              @keyframes loc-ping {
                0%   { transform: scale(1);   opacity: 0.6; }
                70%  { transform: scale(2.2); opacity: 0; }
                100% { transform: scale(2.2); opacity: 0; }
              }
            `}</style>
            {/* Pulsing ring */}
            <div style={{
              position: "absolute",
              width: 24,
              height: 24,
              top: 0,
              left: 0,
              borderRadius: "50%",
              backgroundColor: "rgba(239,68,68,0.35)",
              animation: "loc-ping 1.4s cubic-bezier(0,0,0.2,1) infinite",
            }} />
            {/* Red dot */}
            <div style={{
              position: "relative",
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#EF4444",
              border: "1.5px solid white",
              boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            }} />
          </div>
        </OverlayView>
      )}

      {/* Mobile bottom sheet popup */}
      {selectedBusiness && isMobile && (
        <BusinessPopup
          business={selectedBusiness}
          onClose={() => setSelectedBusiness(null)}
          isMobile
        />
      )}

      {/* Mobile — locate me button */}
      {isMobile && (
        <div className="absolute bottom-24 left-3 z-10">
          <button
            onClick={() => {
              if (!navigator.geolocation) return;
              navigator.geolocation.getCurrentPosition((pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserLocation(loc);
                onUserLocationChange?.(loc);
                mapRef.current?.panTo(loc);
                mapRef.current?.setZoom(15);
              });
            }}
            className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669]"
            style={{ background: "linear-gradient(135deg,#059669 0%,#047857 100%)" }}
            aria-label="מיקום שלי"
          >
            {/* Navigation arrow — points to current location */}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
            </svg>
          </button>
        </div>
      )}
    </GoogleMap>
  );
}
