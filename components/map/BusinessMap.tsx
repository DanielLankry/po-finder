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

        const CATEGORY_COLORS: Record<string, string> = {
          coffee:  "#92400E",
          food:    "#C2410C",
          sweets:  "#BE185D",
          meat:    "#991B1B",
          vegan:   "#166534",
          celiac:  "#78350F",
          flowers: "#9D174D",
          jewelry: "#5B21B6",
          vintage: "#6D28D9",
        };
        const fillColor = open
          ? (CATEGORY_COLORS[business.category] ?? "#059669")
          : "#D6D3D1";

        return (
          <OverlayView
            key={business.id}
            position={{ lat, lng }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div
              className={`absolute cursor-pointer select-none flex flex-col items-center justify-center transition-all duration-300 ease-out origin-center ${
                isSelected || isHovered ? "z-20" : "z-10 hover:z-20"
              }`}
              style={{
                transform: `translate(-50%, -50%)`,
                filter: isSelected || isHovered ? "drop-shadow(0 4px 12px rgba(239, 68, 68, 0.4))" : "drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
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
                className={`rounded-full border-[1.5px] border-white transition-all duration-300 shadow-sm relative flex items-center justify-center ${
                  isSelected || isHovered ? "w-6 h-6" : "w-4 h-4"
                }`}
                style={{ backgroundColor: fillColor }}
              >
                {!open && (
                  <div className={`absolute inset-0 m-auto bg-white/80 rounded-full transition-all duration-300 ${isSelected || isHovered ? "w-2 h-2" : "w-1.5 h-1.5"}`} />
                )}
              </div>

              {/* Popup for desktop */}
              {isSelected && !isMobile && (
                <BusinessPopup
                  business={business}
                  onClose={() => setSelectedBusiness(null)}
                />
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
        >
          <div
            className="absolute"
            style={{ transform: "translate(-50%, -50%)" }}
          >
            {/* Pulsing ring */}
            <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping"
              style={{ width: 22, height: 22, top: -5, left: -5 }} />
            {/* Red dot */}
            <div
              className="w-3 h-3 rounded-full border-[1.5px] border-white shadow-sm"
              style={{ backgroundColor: "#EF4444" }}
            />
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
            className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center border border-stone-200 active:bg-stone-100 transition-colors"
            aria-label="מיקום שלי"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#22C55E]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
            </svg>
          </button>
        </div>
      )}
    </GoogleMap>
  );
}
