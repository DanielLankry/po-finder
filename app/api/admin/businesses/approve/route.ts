import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendBusinessApprovedEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = req.cookies.get("admin_session")?.value;
  if (!session || session !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { businessId } = await req.json();
  const supabase = await createClient();

  const { data: biz, error: fetchErr } = await supabase
    .from("businesses")
    .select("id, name, owner_id, expires_at")
    .eq("id", businessId)
    .single();

  if (fetchErr || !biz) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = { is_active: true };
  if (!biz.expires_at) {
    const exp = new Date();
    exp.setMonth(exp.getMonth() + 1);
    updates.expires_at = exp.toISOString();
  }

  const { error } = await supabase
    .from("businesses")
    .update(updates)
    .eq("id", businessId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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
