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
import { getBusinessAvailability } from "@/lib/utils/schedule";
import { hasPublicMapCoordinates } from "@/lib/public-business";
import { CATEGORY_THEME } from "@/lib/category-theme";
interface BusinessMapProps {
  businesses: BusinessWithSchedule[];
  selectedBusinessId?: string | null;
  onBusinessSelect?: (b: BusinessWithSchedule) => void;
  onBusinessClear?: () => void;
  externalHoveredId?: string | null;
  onBusinessHover?: (id: string | null) => void;
  searchCenter?: { lat: number; lng: number } | null;
  onUserLocationChange?: (loc: { lat: number; lng: number }) => void;
  isVisible?: boolean;
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

/**
 * Separates businesses with identical coordinates just enough for every marker
 * to remain tappable while keeping each icon visually anchored to its location.
 */
function getMarkerDisplayPosition(
  business: BusinessWithSchedule,
  businesses: BusinessWithSchedule[],
): { lat: number; lng: number } | null {
  const lat = business.today_schedule?.lat ?? business.lat;
  const lng = business.today_schedule?.lng ?? business.lng;
  if (lat == null || lng == null) return null;

  const samePosition = businesses.filter((candidate) => {
    const candidateLat = candidate.today_schedule?.lat ?? candidate.lat;
    const candidateLng = candidate.today_schedule?.lng ?? candidate.lng;
    return candidateLat === lat && candidateLng === lng;
  });
  if (samePosition.length === 1) return { lat, lng };

  const positionIndex = samePosition.findIndex((candidate) => candidate.id === business.id);
  const angle = (positionIndex / samePosition.length) * Math.PI * 2 - Math.PI / 2;
  const latitudeRadius = 0.00028;
  const longitudeRadius = latitudeRadius / Math.max(Math.cos((lat * Math.PI) / 180), 0.3);

  return {
    lat: lat + Math.sin(angle) * latitudeRadius,
    lng: lng + Math.cos(angle) * longitudeRadius,
  };
}

export default function BusinessMap({
  businesses,
  selectedBusinessId,
  onBusinessSelect,
  onBusinessClear,
  externalHoveredId,
  onBusinessHover,
  searchCenter,
  onUserLocationChange,
  isVisible = true,
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
  const [locationError, setLocationError] = useState<string | null>(null);
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

  // Reframe after a hidden mobile map becomes visible so overlays use its real size.
  const fitBusinessesOnMap = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const coordinates = businesses
      .map((business) => ({
        lat: business.today_schedule?.lat ?? business.lat,
        lng: business.today_schedule?.lng ?? business.lng,
      }))
      .filter((coordinate): coordinate is { lat: number; lng: number } =>
        coordinate.lat != null && coordinate.lng != null,
      );

    if (coordinates.length === 0) return;
    if (coordinates.length === 1) {
      map.panTo(clampToIsraelBounds(coordinates[0]));
      map.setZoom(14);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    coordinates.forEach((coordinate) => bounds.extend(coordinate));
    map.fitBounds(bounds, 56);
    google.maps.event.addListenerOnce(map, "idle", () => {
      if ((map.getZoom() ?? DEFAULT_ZOOM) > 14) map.setZoom(14);
    });
  }, [businesses]);

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

  useEffect(() => {
    if ((!isVisible && isMobile) || !mapReady || !mapRef.current) return;

    const frame = window.requestAnimationFrame(() => {
      const map = mapRef.current;
      if (!map) return;
      const centerBeforeResize = map.getCenter();
      google.maps.event.trigger(map, "resize");
      if (centerBeforeResize) map.setCenter(centerBeforeResize);
      if (!selectedBusinessId && !searchCenter && !userLocation) {
        fitBusinessesOnMap();
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [fitBusinessesOnMap, isMobile, isVisible, mapReady, searchCenter, selectedBusinessId, userLocation]);

  const visibleBusinesses = businesses.filter(hasPublicMapCoordinates);

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
        zoomControl: !isMobile,
        clickableIcons: false,
        gestureHandling: "greedy",
        keyboardShortcuts: true,
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
        const displayPosition = getMarkerDisplayPosition(business, visibleBusinesses);
        if (!displayPosition) return null;

        const isSelected = selectedBusiness?.id === business.id;
        const internalHovered = hoveredId === business.id;
        const isHovered = internalHovered || externalHoveredId === business.id;
        const availability = getBusinessAvailability(business);

        const CategoryIcon = CATEGORY_ICONS[business.category] ?? MapPin;
        const categoryTheme = CATEGORY_THEME[business.category];
        const availabilityLabel = availability === "open"
          ? "פתוח עכשיו"
          : availability === "closed"
            ? "סגור עכשיו"
            : "שעות הפעילות לא ידועות";

        const size = isSelected || isHovered ? 40 : 32;
        const hitSize = 44;

        return (
          <OverlayView
            key={business.id}
            position={displayPosition}
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
                userSelect: "none",
                transition: "filter 0.2s",
              }}
              onMouseEnter={() => {
                setHoveredId(business.id);
                onBusinessHover?.(business.id);
              }}
              onMouseLeave={() => {
                setHoveredId(null);
                onBusinessHover?.(null);
              }}
            >
              <button
                type="button"
                className="absolute inset-0 flex cursor-pointer items-center justify-center border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#17402D]/40"
                onClick={(event) => {
                  event.stopPropagation();
                  selectBusiness(business);
                }}
                aria-label={`${business.name} — ${CATEGORY_LABELS[business.category]}, ${availabilityLabel}`}
              >
                <span
                  style={{
                    width: size,
                    height: size,
                    backgroundColor: categoryTheme.background,
                    color: categoryTheme.ink,
                    border: `${isSelected ? 3 : 2}px solid ${isSelected ? "#C4552D" : "#17402D"}`,
                    boxShadow: isSelected
                      ? "4px 4px 0 #17402D"
                      : isHovered
                        ? "3px 3px 0 #17402D"
                        : "2px 2px 0 rgba(23,64,45,0.72)",
                  }}
                  className="flex items-center justify-center rounded-full transition-all duration-200"
                  aria-hidden="true"
                >
                  <CategoryIcon className={isSelected || isHovered ? "h-5 w-5" : "h-4 w-4"} />
                </span>
              </button>

              {/* Popup for desktop */}
              {isSelected && !isMobile && (
                <div
                  className="pointer-events-auto absolute bottom-[calc(100%+16px)] left-1/2 z-30 -translate-x-1/2"
                  onClick={(event) => event.stopPropagation()}
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
          <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#17402D] bg-[#FFF3B0] text-[#17402D] shadow-[2px_2px_0_0_#17402D] animate-pulse">
            <LocateFixed className="h-4 w-4" aria-label="המיקום שלכם" />
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
              if (!navigator.geolocation) {
                setLocationError("הדפדפן לא תומך באיתור מיקום");
                return;
              }
              setLocationError(null);
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                  };
                  if (!isWithinIsraelBounds(location)) {
                    setLocationError("אפשר להשתמש במיקום בישראל בלבד");
                    return;
                  }
                  setUserLocation(location);
                  onUserLocationChange?.(location);
                  mapRef.current?.panTo(location);
                  mapRef.current?.setZoom(15);
                },
                () => setLocationError("לא הצלחנו לקבל את המיקום. בדקו הרשאה ונסו שוב."),
                { timeout: 10000, enableHighAccuracy: true },
              );
            }}
            className="business-type-button flex h-11 min-h-0 w-11 items-center justify-center bg-[#17402D] p-0 text-[#FFFDF7]"
            aria-label="מיקום שלי"
          >
            <LocateFixed className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}

      {locationError && (
        <div
          className="absolute bottom-40 left-3 right-3 z-20 rounded-2xl border-2 border-[#8A3618] bg-[#FFF8DC] px-4 py-3 text-center text-sm font-bold text-[#8A3618] shadow-[3px_3px_0_0_#8A3618]"
          role="alert"
        >
          {locationError}
        </div>
      )}
    </GoogleMap>
  );
}
