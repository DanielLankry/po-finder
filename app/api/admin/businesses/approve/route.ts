import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendBusinessApprovedEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { businessId, secret } = await req.json();

  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // Get business details + owner email
  const { data: biz, error: fetchErr } = await supabase
    .from("businesses")
    .select("id, name, owner_id, expires_at")
    .eq("id", businessId)
    .single();

  if (fetchErr || !biz) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // Only set expires_at if not already set (payment sets it, approval activates it)
  const updates: Record<string, unknown> = { is_active: true };
  if (!biz.expires_at) {
    // Default: 1 month if no payment was made (shouldn't happen but safety)
    const exp = new Date();
    exp.setMonth(exp.getMonth() + 1);
    updates.expires_at = exp.toISOString();
  }

  const { error } = await supabase
    .from("businesses")
    .update(updates)
    .eq("id", businessId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get owner email from auth.users via service role (fallback: users table)
  const { data: userData } = await supabase
    .from("users")
    .select("email")
    .eq("id", biz.owner_id)
    .single();

  if (userData?.email) {
    try {
      await sendBusinessApprovedEmail(userData.email, biz.name);
    } catch (emailErr) {
      console.error("Failed to send approval email:", emailErr);
    }
  }

  return NextResponse.json({ ok: true });
}
