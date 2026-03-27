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
    .select("id, name, owner_id")
    .eq("id", businessId)
    .single();

  if (fetchErr || !biz) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // Activate business
  const { error } = await supabase
    .from("businesses")
    .update({ is_active: true })
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
