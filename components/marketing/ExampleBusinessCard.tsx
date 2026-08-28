"use client";

import BusinessCard from "@/components/business/BusinessCard";
import type { BusinessWithSchedule } from "@/lib/types";
import { getTodayDateString } from "@/lib/utils/schedule";

const EXAMPLE_BUSINESS_ID = "00000000-0000-4000-8000-000000000020";

/**
 * Builds realistic demonstration data for the standard public business card.
 * The row never reaches the database, so it cannot be mistaken for a real listing.
 */
function createExampleBusiness(): BusinessWithSchedule {
  const today = getTodayDateString();

  return {
    id: EXAMPLE_BUSINESS_ID,
    owner_id: "00000000-0000-4000-8000-000000000000",
    name: "נונה קפה",
    description: "קפה שכונתי, כריכים טריים ומאפים שנאפים בכל בוקר.",
    category: "coffee",
    address: "לבונטין, תל אביב-יפו",
    lat: null,
    lng: null,
    weekly_hours: null,
    phone: null,
    whatsapp: null,
    website: null,
    instagram: null,
    kashrut: "kosher",
    business_number: null,
    avg_rating: 4.8,
    review_count: 36,
    is_active: true,
    is_verified: true,
    created_at: "2026-08-11T00:00:00.000Z",
    expires_at: null,
    photos: [],
    today_schedule: {
      id: "00000000-0000-4000-8000-000000000021",
      business_id: EXAMPLE_BUSINESS_ID,
      date: today,
      address: "לבונטין, תל אביב-יפו",
      lat: null,
      lng: null,
      open_time: "07:30:00",
      close_time: "20:30:00",
      note: "שעות ומיקום לדוגמה",
      created_at: "2026-08-11T00:00:00.000Z",
    },
    hours_status: "scheduled",
  };
}

/** Renders the sample through the same card component used by real businesses. */
export default function ExampleBusinessCard() {
  return (
    <div className="mx-auto w-full max-w-[420px]" data-testid="example-business-card">
      <BusinessCard
        business={createExampleBusiness()}
        isSelected={false}
        isFavorited={false}
        onClick={() => undefined}
        badgeLabel="עסק לדוגמה"
        hideFavorite
        disabled
      />
    </div>
  );
}
