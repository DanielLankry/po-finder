import type {
  BusinessCategory,
  BusinessWithSchedule,
  KashrutStatus,
} from "@/lib/types";
import { getBusinessAvailability } from "@/lib/utils/schedule";

export interface BusinessDiscoveryFilters {
  activeCategory: BusinessCategory | "all";
  kashrut: KashrutStatus | "all";
  minRating: number;
  openNow: boolean;
  search: string;
}

/**
 * Applies the one public-discovery rule set used by both the map and list.
 * Confirmed-closed businesses are hidden; unknown hours remain discoverable.
 */
export function matchesBusinessDiscovery(
  business: BusinessWithSchedule,
  filters: BusinessDiscoveryFilters,
): boolean {
  const availability = getBusinessAvailability(business);
  if (availability === "closed") return false;
  if (filters.openNow && availability !== "open") return false;
  if (
    filters.activeCategory !== "all" &&
    business.category !== filters.activeCategory
  ) {
    return false;
  }
  if (filters.kashrut !== "all" && business.kashrut !== filters.kashrut) {
    return false;
  }
  if (filters.minRating > 0 && business.avg_rating < filters.minRating) {
    return false;
  }

  const query = filters.search.trim().toLocaleLowerCase("he");
  if (!query) return true;

  return [
    business.name,
    business.description,
    business.address,
    business.today_schedule?.address,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("he")
    .includes(query);
}
