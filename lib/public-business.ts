import type { BusinessWithSchedule } from "@/lib/types";

function hasCoordinate(value: number | null | undefined): boolean {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Decides whether an active business has enough data for the public map/list.
 * Schedules are optional here: without one, the card can still render from the
 * base business address and coordinates, while "open now" remains false.
 */
export function isPublicReadyBusiness(
  business: Pick<BusinessWithSchedule, "name" | "lat" | "lng" | "today_schedule">,
): boolean {
  return business.name.trim().length > 0;
}

export function hasPublicMapCoordinates(
  business: Pick<BusinessWithSchedule, "lat" | "lng" | "today_schedule">,
): boolean {
  const lat = business.today_schedule?.lat ?? business.lat;
  const lng = business.today_schedule?.lng ?? business.lng;

  return hasCoordinate(lat) && hasCoordinate(lng);
}
