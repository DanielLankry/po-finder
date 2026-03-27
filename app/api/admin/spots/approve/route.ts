import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendSpotApprovedEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { spotId, secret } = await req.json();

  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // Get spot to calculate expiry
  const { data: spot, error: fetchErr } = await supabase
    .from("spots")
    .select("duration_days")
    .eq("id", spotId)
    .single();

  if (fetchErr || !spot) {
    return NextResponse.json({ error: "Spot not found" }, { status: 404 });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + spot.duration_days * 86400 * 1000);

  const { data: spotData, error } = await supabase
    .from("spots")
    .update({
      is_approved: true,
      starts_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .eq("id", spotId)
    .select("name, owner_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send approval email to spot owner
  if (spotData) {
    const { data: userData } = await supabase
      .from("users")
      .select("email")
      .eq("id", spotData.owner_id)
      .single();

    if (userData?.email) {
      try {
        await sendSpotApprovedEmail(userData.email, spotData.name, expiresAt);
      } catch (emailErr) {
        console.error("Failed to send spot approval email:", emailErr);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
