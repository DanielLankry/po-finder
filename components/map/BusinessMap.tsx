"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  OverlayView,
} from "@react-google-maps/api";
import { warmMapStyle, TEL_AVIV_CENTER, DEFAULT_ZOOM } from "@/lib/maps/mapStyle";
import BusinessPopup from "./BusinessPopup";
import type { BusinessWithSchedule, BusinessCategory } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { isOpenNow } from "@/lib/utils/schedule";
import type { FilterState } from "../filters/FilterDrawer";
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

        </div>
      )}
    </GoogleMap>
  );
}
