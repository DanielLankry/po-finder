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
