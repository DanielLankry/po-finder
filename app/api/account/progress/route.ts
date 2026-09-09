import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOwnedBusinesses } from "@/lib/db/owned-businesses";
import { getProfileCompletion, getOwnerJourney } from "@/lib/owner-progress";
import { getIsraelDateContext } from "@/lib/utils/schedule";

export const dynamic = "force-dynamic";

/** Owner-only read model; profile quality never writes approval or paid entitlements. */
export async function GET(request: NextRequest) {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
    const businesses = await getOwnedBusinesses(supabase);
    const requested = request.nextUrl.searchParams.get("businessId");
    const business = requested ? businesses.find((item) => item.id === requested) : businesses[0];
    if (requested && !business) return NextResponse.json({ error: "Business not found" }, { status: 404, headers });
    const now = new Date();
    const context = getIsraelDateContext(now);
    const emailVerified = Boolean(user.email_confirmed_at);
    if (!business) return NextResponse.json({
      business: null, businesses: [], emailVerified, daily: [], weekly: [],
      completion: getProfileCompletion(null), journey: getOwnerJourney(null, emailVerified, now.toISOString()), updatedAt: now.toISOString(),
    }, { headers });
    const [photos, weekly, daily, payment] = await Promise.all([
      supabase.from("photos").select("is_primary, url").eq("business_id", business.id),
      supabase.from("business_weekly_schedule").select("*").eq("business_id", business.id),
      supabase.from("business_schedules").select("*").eq("business_id", business.id).in("date", [context.date, context.previousDate]),
      // RLS scopes payments to this session; user_id is deliberately not a selectable column.
      supabase.from("payment_attempts").select("status").eq("business_id", business.id).in("status", ["pending", "succeeded"]).order("created_at", { ascending: false }).limit(1),
    ]);
    if (photos.error || weekly.error || daily.error || payment.error) throw new Error("Progress read failed");
    return NextResponse.json({
      business, businesses: businesses.map(({ id, name }) => ({ id, name })), emailVerified,
      daily: daily.data, weekly: weekly.data,
      completion: getProfileCompletion(business, photos.data, weekly.data, daily.data, context.date),
      journey: getOwnerJourney(business, emailVerified, now.toISOString(), payment.data[0]?.status === "pending"),
      updatedAt: now.toISOString(),
    }, { headers });
  } catch {
    return NextResponse.json({ error: "לא הצלחנו לעדכן את מצב העסק. נסו שוב." }, { status: 500, headers });
  }
}
