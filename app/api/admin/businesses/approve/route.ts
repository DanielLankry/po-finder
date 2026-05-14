import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { sendBusinessApprovedEmail } from "@/lib/email";
import { z } from "zod";

export const runtime = "nodejs";

const approveSchema = z.object({
  businessId: z.string().uuid("Invalid business ID"),
});

export async function POST(req: NextRequest) {
  const session = req.cookies.get("admin_session")?.value;
  if (!session || session !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = approveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { businessId } = parsed.data;
  const admin = adminClient();

  const { data: biz, error: fetchErr } = await admin
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

  const { error } = await admin
    .from("businesses")
    .update(updates)
    .eq("id", businessId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: userData } = await admin
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
