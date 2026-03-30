"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Search, LocateFixed, MapPin, X } from "lucide-react";
import { useJsApiLoader } from "@react-google-maps/api";

const LIBRARIES: ("places")[] = ["places"];

export interface LocationResult {
  lat: number;
  lng: number;
  name: string;
}

interface Prediction {
  placeId: string;
  mainText: string;
  secondaryText: string;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [locating, setLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const callbackRef = useRef(onLocationSelect);
  useEffect(() => { callbackRef.current = onLocationSelect; }, [onLocationSelect]);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: LIBRARIES,
    language: "he",
    region: "IL",
  });

  // Fetch predictions with debounce
  useEffect(() => {
    if (!isLoaded || query.length < 2) {
      setPredictions([]);
      setOpen(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const svc = new google.maps.places.AutocompleteService();
      svc.getPlacePredictions(
        { input: query, componentRestrictions: { country: "IL" }, language: "he" },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            setPredictions(results.map((r) => ({
              placeId: r.place_id,
              mainText: r.structured_formatting.main_text,
              secondaryText: r.structured_formatting.secondary_text ?? "",
            })));
            setOpen(true);
            setActiveIndex(-1);
          } else {
            setPredictions([]);
            setOpen(false);
          }
        }
      );
    }, 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, isLoaded]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function selectPrediction(p: Prediction) {
    setOpen(false);
    setQuery("");
    setPredictions([]);

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ placeId: p.placeId }, (results, status) => {
      if (status === "OK" && results?.[0]?.geometry?.location) {
        callbackRef.current({
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng(),
          name: p.mainText,
        });
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || predictions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, predictions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectPrediction(predictions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const handleGPS = useCallback(() => {
    if (!navigator.geolocation) { setGpsError("הדפדפן לא תומך באיתור מיקום"); return; }
    setLocating(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let name = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        try {
          const geocoder = new google.maps.Geocoder();
          const result = await geocoder.geocode({ location: { lat, lng } });
          if (result.results?.[0]) name = result.results[0].formatted_address;
        } catch { /* fallback */ }
        callbackRef.current({ lat, lng, name });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) setGpsError("הגישה למיקום נחסמה");
        else if (err.code === err.POSITION_UNAVAILABLE) setGpsError("לא הצלחנו לאתר את המיקום");
        else setGpsError("תם הזמן לאיתור מיקום. נסו שוב");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  return (
    <div className="w-full" ref={containerRef}>
      <div className="flex items-center gap-2 w-full">
        {/* Custom search input */}
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#AAAAAA] pointer-events-none" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => predictions.length > 0 && setOpen(true)}
            placeholder={placeholder}
            disabled={!isLoaded}
            className="w-full h-11 rounded-full border border-[#DDDDDD] bg-[#F7F5F0] ps-10 pe-9 text-base md:text-sm text-[#222222] placeholder:text-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent focus:bg-white transition-all disabled:opacity-50"
            dir="rtl"
            aria-label="חיפוש מיקום"
            autoComplete="off"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setPredictions([]); setOpen(false); inputRef.current?.focus(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AAA] hover:text-[#555] transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Custom dropdown */}
          {open && predictions.length > 0 && (
            <div
              className="absolute top-[calc(100%+6px)] right-0 left-0 z-50 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-[#E5E7EB] overflow-hidden"
              dir="rtl"
            >
              {predictions.map((p, i) => (
                <button
                  key={p.placeId}
                  onMouseDown={(e) => { e.preventDefault(); selectPrediction(p); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-right transition-colors ${
                    i === activeIndex ? "bg-[#F0FDF4]" : "hover:bg-[#F9FAFB]"
                  } ${i < predictions.length - 1 ? "border-b border-[#F3F4F6]" : ""}`}
                >
                  <MapPin className="h-4 w-4 text-[#059669] flex-shrink-0" />
                  <div className="min-w-0 text-right">
                    <p className="text-sm font-semibold text-[#111] truncate">{p.mainText}</p>
                    {p.secondaryText && (
                      <p className="text-xs text-[#888] truncate">{p.secondaryText}</p>
                    )}
                  </div>
                </button>
              ))}
              <div className="px-4 py-2 border-t border-[#F3F4F6] flex justify-end">
                <span className="text-[10px] text-[#CCC]">powered by Google</span>
              </div>
            </div>
          )}
        </div>

        {/* GPS button */}
        <button
          onClick={handleGPS}
          disabled={locating}
          title="מיקום נוכחי"
          className="flex-shrink-0 h-11 w-11 rounded-full flex items-center justify-center transition-all disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
          style={{ background: "linear-gradient(135deg,#059669 0%,#047857 100%)" }}
          aria-label="השתמש במיקום הנוכחי"
        >
          <LocateFixed className={`h-[18px] w-[18px] text-white ${locating ? "animate-spin" : ""}`} aria-hidden="true" />
        </button>
      </div>

      {gpsError && (
        <p className="text-red-500 text-xs mt-1.5" dir="rtl" role="alert">{gpsError}</p>
      )}
    </div>
  );
}
