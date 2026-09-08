import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendMetaLeadEvent } from "@/lib/meta-conversions";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Verifies an owned draft and mirrors its consented browser Lead to Meta CAPI. */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { businessId?: string; consent?: boolean }
    | null;

  if (
    body?.consent !== true ||
    !body.businessId ||
    !UUID_PATTERN.test(body.businessId)
  ) {
    return NextResponse.json({ error: "Invalid lead event" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: business, error } = await adminClient()
    .from("businesses")
    .select("id, owner_id, category, phone")
    .eq("id", body.businessId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error || !business) {
    return NextResponse.json({ error: "Business draft not found" }, { status: 404 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pokarov.co.il";

  try {
    const result = await sendMetaLeadEvent({
      eventId: `business-${business.id}`,
      eventSourceUrl: new URL("/dashboard/profile", siteUrl).toString(),
      email: user.email,
      externalId: user.id,
      phone: business.phone,
      category: business.category,
      clientIp: forwardedFor,
      clientUserAgent: request.headers.get("user-agent"),
      fbp: request.cookies.get("_fbp")?.value,
      fbc: request.cookies.get("_fbc")?.value,
    });

    return NextResponse.json(result, { status: result.sent ? 200 : 202 });
  } catch (sendError) {
    console.error("Failed to send Meta Lead event:", sendError);
    return NextResponse.json({ error: "Meta event unavailable" }, { status: 502 });
  }
}
