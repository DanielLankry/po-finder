import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-session";
import { adminClient } from "@/lib/supabase/admin";
import { updateAdminBusiness } from "@/lib/admin-business-update";
import { z } from "zod";

export const runtime = "nodejs";

const approveSchema = z.object({
  businessId: z.string().uuid("Invalid business ID"),
}).strict();

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = approveSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const result = await updateAdminBusiness(adminClient(), parsed.data.businessId, { is_verified: true }, true);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  const { business, notificationStatus } = result;
  return NextResponse.json({
    ok: true,
    isVerified: business.is_verified,
    isActive: business.is_active,
    expiresAt: business.expires_at,
    promotionGranted: business.promotion_code === "first-20-3m" && !!business.promotion_activated_at,
    notificationStatus,
  });
}
