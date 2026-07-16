import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

const analyticsEventSchema = z.object({
  businessId: z.string().uuid(),
  eventType: z.enum(["view", "call_click", "whatsapp_click", "directions_click"]),
  sessionId: z.string().trim().max(128).optional().nullable(),
});

/**
 * Records consented, rate-limited business analytics without exposing a
 * writeable analytics table through the public Supabase API.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`analytics:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: "Too many events" }, { status: 429 });
  }

  const parsed = analyticsEventSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  const admin = adminClient();
  const nowIso = new Date().toISOString();
  const { data: business } = await admin
    .from("businesses")
    .select("id")
    .eq("id", parsed.data.businessId)
    .eq("is_verified", true)
    .eq("is_active", true)
    .or(`is_legacy_public.eq.true,expires_at.gt.${nowIso}`)
    .maybeSingle();

  if (!business) {
    return NextResponse.json({ error: "Business is not public" }, { status: 404 });
  }

  const { error } = await admin.from("business_analytics_events").insert({
    business_id: parsed.data.businessId,
    event_type: parsed.data.eventType,
    session_id: parsed.data.sessionId || null,
  });

  if (error) {
    console.error("[/api/analytics/events] insert failed:", error);
    return NextResponse.json({ error: "Could not record event" }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
