export const warmMapStyle: google.maps.MapTypeStyle[] = [
  { featureType: "all", elementType: "geometry", stylers: [{ color: "#EEF5F0" }] },
  { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#B8D8D8" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#D8EAE0" }] },
  { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#D4EDDA" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#B2DFBC" }] },
  { featureType: "landscape.man_made", elementType: "geometry.fill", stylers: [{ color: "#E8F2EC" }] },
  { featureType: "landscape.natural", elementType: "geometry.fill", stylers: [{ color: "#DFF0E5" }] },
  { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ visibility: "on" }, { color: "#C8E6C9" }] },
  { featureType: "poi.park", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#B2CFBB" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#5A7A65" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#7A9E87" }] },
];

export const TEL_AVIV_CENTER = { lat: 32.0853, lng: 34.7818 };
export const DEFAULT_ZOOM = 13;

// Bounding box covering Israel from Eilat to the northern border.
// Google Maps uses these bounds for viewport restriction; searches and GPS
// results are also checked against the same box before moving the map.
export const ISRAEL_BOUNDS = {
  north: 33.4,
  south: 29.45,
  west: 34.15,
  east: 35.95,
} as const;

export const MIN_ISRAEL_ZOOM = 7;
export const MAX_ISRAEL_ZOOM = 19;

export function isWithinIsraelBounds(loc: { lat: number; lng: number }) {
  return (
    loc.lat >= ISRAEL_BOUNDS.south &&
    loc.lat <= ISRAEL_BOUNDS.north &&
    loc.lng >= ISRAEL_BOUNDS.west &&
    loc.lng <= ISRAEL_BOUNDS.east
  );
}

export function clampToIsraelBounds(loc: { lat: number; lng: number }) {
  return {
    lat: Math.min(Math.max(loc.lat, ISRAEL_BOUNDS.south), ISRAEL_BOUNDS.north),
    lng: Math.min(Math.max(loc.lng, ISRAEL_BOUNDS.west), ISRAEL_BOUNDS.east),
  };
}
