"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Search, LocateFixed } from "lucide-react";
import { useJsApiLoader } from "@react-google-maps/api";

const LIBRARIES: ("places")[] = ["places"];

export interface LocationResult {
  lat: number;
  lng: number;
  name: string;
}

interface PlacesSearchBarProps {
  onLocationSelect: (loc: LocationResult) => void;
  placeholder?: string;
}

export default function PlacesSearchBar({
  onLocationSelect,
  placeholder = "חפשו עיר, שכונה או כתובת...",
}: PlacesSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [locating, setLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Keep callback ref stable to avoid re-init of autocomplete
  const callbackRef = useRef(onLocationSelect);
  useEffect(() => { callbackRef.current = onLocationSelect; }, [onLocationSelect]);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: LIBRARIES,
    language: "he",
    region: "IL",
  });

  // Attach Google Places Autocomplete once Maps SDK is ready
  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "IL" },
      fields: ["geometry", "name", "formatted_address"],
      types: ["geocode", "establishment"],
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry?.location) return;

      callbackRef.current({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        name: place.name ?? place.formatted_address ?? "",
      });

      // Clear the input text after selection
      if (inputRef.current) inputRef.current.value = "";
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [isLoaded]);

  const handleGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError("הדפדפן לא תומך באיתור מיקום");
      return;
    }
    setLocating(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        // Reverse geocode to get actual street address
        let name = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        try {
          const geocoder = new google.maps.Geocoder();
          const result = await geocoder.geocode({ location: { lat, lng } });
          if (result.results?.[0]) {
            name = result.results[0].formatted_address;
          }
        } catch {
          // fallback to coordinates
        }

        callbackRef.current({ lat, lng, name });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError("הגישה למיקום נחסמה. אפשרו גישה למיקום בהגדרות הדפדפן");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGpsError("לא הצלחנו לאתר את המיקום שלכם");
        } else {
          setGpsError("תם הזמן לאיתור מיקום. נסו שוב");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 w-full">
        {/* Search input with Places autocomplete */}
        <div className="relative flex-1">
          <Search
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#AAAAAA] pointer-events-none"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            disabled={!isLoaded}
            className="w-full h-11 rounded-full border border-[#DDDDDD] bg-[#F7F5F0] ps-10 pe-4 text-base md:text-sm text-[#222222] placeholder:text-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent focus:bg-white transition-all disabled:opacity-50"
            dir="rtl"
            aria-label="חיפוש מיקום"
          />
        </div>

        {/* GPS / current location button */}
        <button
          onClick={handleGPS}
          disabled={locating}
          title="מיקום נוכחי"
          className="flex-shrink-0 h-11 w-11 rounded-full flex items-center justify-center transition-all disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
          style={{ background: "linear-gradient(135deg,#059669 0%,#047857 100%)" }}
          aria-label="השתמש במיקום הנוכחי"
        >
          <LocateFixed
            className={`h-[18px] w-[18px] text-white ${locating ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>
      {gpsError && (
        <p className="text-red-500 text-xs mt-1.5" dir="rtl" role="alert">{gpsError}</p>
      )}
    </div>
  );
}
