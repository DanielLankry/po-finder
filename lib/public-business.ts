import type { BusinessWithSchedule } from "@/lib/types";

const DEMO_BUSINESS_NAME_PATTERN = /(בדיקה|דמו|טסט|demo|test)/i;

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
  const lat = business.today_schedule?.lat ?? business.lat;
  const lng = business.today_schedule?.lng ?? business.lng;

  return (
    !DEMO_BUSINESS_NAME_PATTERN.test(business.name) &&
    hasCoordinate(lat) &&
    hasCoordinate(lng)
  );
}
