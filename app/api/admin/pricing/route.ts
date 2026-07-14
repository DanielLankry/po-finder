import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/admin-session";
import { adminClient } from "@/lib/supabase/admin";
import { getPlans } from "@/lib/plans-server";
import { PLAN_CODES } from "@/lib/plans";

export const runtime = "nodejs";

const planSchema = z.object({
  code: z.enum(PLAN_CODES),
  months: z.number().int().min(1).max(12),
  label: z.string().min(1).max(100),
  price: z.number().int().positive(),
});

const pricingSchema = z.object({ plans: z.array(planSchema).length(PLAN_CODES.length) });

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ plans: await getPlans() });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = pricingSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const receivedCodes = new Set(parsed.data.plans.map((plan) => plan.code));
  if (receivedCodes.size !== PLAN_CODES.length || PLAN_CODES.some((code) => !receivedCodes.has(code))) {
    return NextResponse.json({ error: "catalog must contain every product exactly once" }, { status: 400 });
  }
  if (parsed.data.plans.some((plan) => plan.code !== `listing_${plan.months}m`)) {
    return NextResponse.json({ error: "duration must match the immutable product code" }, { status: 400 });
  }

  const db = adminClient();
  const results = await Promise.all(parsed.data.plans.map((plan) =>
    db.from("plans").update({
      label: plan.label,
      price: plan.price,
    }).eq("code", plan.code).eq("duration_months", plan.months)
  ));
  const error = results.find((result) => result.error)?.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
