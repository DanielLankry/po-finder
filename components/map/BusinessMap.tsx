"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  OverlayView,
} from "@react-google-maps/api";
import {
  clampToIsraelBounds,
  DEFAULT_ZOOM,
  ISRAEL_BOUNDS,
  isWithinIsraelBounds,
  MAX_ISRAEL_ZOOM,
  MIN_ISRAEL_ZOOM,
  TEL_AVIV_CENTER,
  warmMapStyle,
} from "@/lib/maps/mapStyle";
import {
  Beef,
  CakeSlice,
  Coffee,
  Flower2,
  Gem,
  Leaf,
  LocateFixed,
  MapPin,
  Shirt,
  UtensilsCrossed,
  Wheat,
} from "lucide-react";
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
  onBusinessClear?: () => void;
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

const CATEGORY_ICONS: Record<BusinessCategory, typeof MapPin> = {
  coffee: Coffee,
  food: UtensilsCrossed,
  sweets: CakeSlice,
  meat: Beef,
  vegan: Leaf,
  celiac: Wheat,
  flowers: Flower2,
  jewelry: Gem,
  vintage: Shirt,
};

export default function BusinessMap({
  businesses,
  activeCategory,
  filters,
  selectedBusinessId,
  onBusinessSelect,
  onBusinessClear,
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
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 1440 : false
  );
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const lastFocusedBusinessId = useRef<string | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
    language: "he",
    region: "IL",
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1440);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setMapReady(true);
  }, []);

  const focusBusinessOnMap = useCallback((business: BusinessWithSchedule) => {
    const map = mapRef.current;
    if (!map) return;

    const lat = business.today_schedule?.lat ?? business.lat;
    const lng = business.today_schedule?.lng ?? business.lng;
    if (lat == null || lng == null) return;

    lastFocusedBusinessId.current = business.id;
    map.panTo(clampToIsraelBounds({ lat, lng }));
    if ((map.getZoom() ?? DEFAULT_ZOOM) < 14) map.setZoom(14);

    google.maps.event.addListenerOnce(map, "idle", () => {
      const mapHeight = map.getDiv().clientHeight;
      const offset = isMobile
        ? Math.min(150, Math.round(mapHeight * 0.18))
        : -Math.min(135, Math.round(mapHeight * 0.16));
      map.panBy(0, offset);
    });
  }, [isMobile]);

  const selectBusiness = useCallback((business: BusinessWithSchedule) => {
    setSelectedBusiness(business);
    focusBusinessOnMap(business);
    onBusinessSelect?.(business);
  }, [focusBusinessOnMap, onBusinessSelect]);

  const clearSelectedBusiness = useCallback(() => {
    lastFocusedBusinessId.current = null;
    setSelectedBusiness(null);
    onBusinessClear?.();
  }, [onBusinessClear]);

  // Keep list, marker, popup, and camera selection in one synchronized state.
  useEffect(() => {
    const business = selectedBusinessId
      ? businesses.find((candidate) => candidate.id === selectedBusinessId) ?? null
      : null;
    const syncTimer = window.setTimeout(() => setSelectedBusiness(business), 0);
    if (business && lastFocusedBusinessId.current !== business.id) focusBusinessOnMap(business);
    return () => window.clearTimeout(syncTimer);
  }, [selectedBusinessId, businesses, focusBusinessOnMap, mapReady]);

  // Pan + zoom when a location is chosen from the search bar or GPS
  useEffect(() => {
    if (!searchCenter || !mapRef.current) return;
    lastFocusedBusinessId.current = null;
    mapRef.current.panTo(clampToIsraelBounds({ lat: searchCenter.lat, lng: searchCenter.lng }));
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
          <div className="h-10 w-10 rounded-full border-4 border-[#DDEBE0] border-t-[#2D6A4F] animate-spin mx-auto mb-3" />
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
        minZoom: MIN_ISRAEL_ZOOM,
        maxZoom: MAX_ISRAEL_ZOOM,
        restriction: {
          latLngBounds: ISRAEL_BOUNDS,
          strictBounds: true,
        },
      }}
      onLoad={onMapLoad}
      onUnmount={() => {
        mapRef.current = null;
        setMapReady(false);
      }}
      onClick={clearSelectedBusiness}
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

        const CategoryIcon = CATEGORY_ICONS[business.category] ?? MapPin;

        const size = isSelected || isHovered ? 40 : 32;
        const hitSize = 44;

        return (
          <OverlayView
            key={business.id}
            position={{ lat, lng }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            getPixelPositionOffset={() => ({ x: -(hitSize / 2), y: -(hitSize / 2) })}
          >
            <div
              style={{
                position: "relative",
                width: hitSize,
                height: hitSize,
                zIndex: isSelected || isHovered ? 20 : 10,
                filter: isSelected || isHovered
                  ? "drop-shadow(0 4px 12px rgba(0,0,0,0.25))"
                  : "drop-shadow(0 2px 4px rgba(0,0,0,0.12))",
                cursor: "pointer",
                userSelect: "none",
                transition: "filter 0.2s",
              }}
              onClick={(e) => {
                e.stopPropagation();
                selectBusiness(business);
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
                  selectBusiness(business);
                }
              }}
            >
              <div
                style={{
                  width: size,
                  height: size,
                  border: `2px solid ${isSelected ? "#8A3618" : isHovered ? "#17402D" : "rgba(255,255,255,0.9)"}`,
                  opacity: open ? 1 : 0.5,
                  filter: open ? "none" : "grayscale(1)",
                }}
                className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-md select-none transition-all duration-200 ${
                  isSelected ? "bg-[#C4552D] text-white" : "bg-[#FFFDF7] text-[#17402D]"
                }`}
              >
                <CategoryIcon className={isSelected || isHovered ? "h-5 w-5" : "h-4 w-4"} aria-hidden="true" />
              </div>

              {/* Popup for desktop */}
              {isSelected && !isMobile && (
                <div
                  className="pointer-events-auto absolute bottom-[calc(100%+16px)] left-1/2 z-30 -translate-x-1/2"
                >
                  <BusinessPopup
                    business={business}
                    onClose={clearSelectedBusiness}
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
          onClose={clearSelectedBusiness}
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
                if (!isWithinIsraelBounds(loc)) return;
                setUserLocation(loc);
                onUserLocationChange?.(loc);
                mapRef.current?.panTo(loc);
                mapRef.current?.setZoom(15);
              });
            }}
            className="business-type-button flex h-11 min-h-0 w-11 items-center justify-center bg-[#17402D] p-0 text-[#FFFDF7]"
            aria-label="מיקום שלי"
          >
            <LocateFixed className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </GoogleMap>
  );
}
