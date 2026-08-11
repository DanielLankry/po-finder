import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-session";
import { adminClient } from "@/lib/supabase/admin";
import { sendBusinessApprovedEmail } from "@/lib/email";
import { z } from "zod";

export const runtime = "nodejs";

const approveSchema = z.object({
  businessId: z.string().uuid("Invalid business ID"),
});

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
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
    .select("id, name, owner_id, expires_at, promotion_code, promotion_activated_at")
    .eq("id", businessId)
    .single();

  if (fetchErr || !biz) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const { data: updatedBusiness, error } = await admin
    .from("businesses")
    .update({
      is_verified: true,
      is_active: !!biz.expires_at && Date.parse(biz.expires_at) > Date.now(),
    })
    .eq("id", businessId)
    .select("expires_at, promotion_code, promotion_activated_at, is_active")
    .single();

  if (error || !updatedBusiness) {
    return NextResponse.json(
      { error: error?.message ?? "Business approval was not returned" },
      { status: 500 },
    );
  }

  const { data: userData } = await admin
    .from("users")
    .select("email")
    .eq("id", biz.owner_id)
    .single();

  const promotionGranted =
    updatedBusiness.promotion_code === "first-20-3m" &&
    !!updatedBusiness.promotion_activated_at;

  if (userData?.email) {
    try {
      await sendBusinessApprovedEmail(
        userData.email,
        biz.name,
        promotionGranted && updatedBusiness.expires_at
          ? new Date(updatedBusiness.expires_at)
          : undefined,
      );
    } catch (emailErr) {
      console.error("Failed to send approval email:", emailErr);
    }
  }

  return NextResponse.json({
    ok: true,
    isVerified: true,
    isActive: updatedBusiness.is_active,
    expiresAt: updatedBusiness.expires_at,
    promotionGranted,
  });
}
