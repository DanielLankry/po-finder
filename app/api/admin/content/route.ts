import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-session";
import { adminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/** Hydrate reviews and scheduled events for one moderation workspace. */
export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = adminClient();
  const [reviewsResult, eventsResult, businessesResult, usersResult] = await Promise.all([
    admin.from("reviews").select("id, business_id, user_id, reviewer_name, rating, comment, created_at").order("created_at", { ascending: false }).limit(500),
    admin.from("business_events").select("id, business_id, title, description, event_date, start_time, end_time, price, created_at").order("event_date", { ascending: false }).limit(500),
    admin.from("businesses").select("id, name"),
    admin.from("users").select("id, email, name"),
  ]);

  const error = reviewsResult.error ?? eventsResult.error ?? businessesResult.error ?? usersResult.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const businessNames = new Map((businessesResult.data ?? []).map((business) => [business.id, business.name]));
  const userNames = new Map((usersResult.data ?? []).map((user) => [user.id, user.name || user.email]));

  return NextResponse.json({
    reviews: (reviewsResult.data ?? []).map((review) => ({
      ...review,
      business_name: businessNames.get(review.business_id) ?? null,
      user_name: review.user_id ? userNames.get(review.user_id) ?? null : null,
    })),
    events: (eventsResult.data ?? []).map((event) => ({
      ...event,
      business_name: businessNames.get(event.business_id) ?? null,
    })),
  });
}
