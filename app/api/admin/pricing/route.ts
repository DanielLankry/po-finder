import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/admin-session";
import { adminClient } from "@/lib/supabase/admin";
import { getPlans } from "@/lib/plans-server";
import {
  MAX_LISTING_PRICE_AGOROT,
  MIN_LISTING_PRICE_AGOROT,
  PLAN_CODES,
  isValidPlanPriceLadder,
} from "@/lib/plans";

export const runtime = "nodejs";

const planSchema = z.object({
  code: z.enum(PLAN_CODES),
  months: z.number().int().min(1).max(12).nullable(),
  days: z.number().int().min(1).max(360),
  label: z.string().min(1).max(100),
  price: z
    .number()
    .int()
    .min(MIN_LISTING_PRICE_AGOROT)
    .max(MAX_LISTING_PRICE_AGOROT)
    .refine((price) => price % 100 === 0, "price must use whole shekels"),
}).strict();

const pricingSchema = z.object({ plans: z.array(planSchema).length(PLAN_CODES.length) }).strict();

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
  const hasInvalidDuration = parsed.data.plans.some((plan) => {
    const dayMatch = plan.code.match(/^listing_(\d+)d$/);
    if (dayMatch) {
      return plan.months !== null || plan.days !== Number(dayMatch[1]);
    }
    return plan.months === null
      || plan.code !== `listing_${plan.months}m`
      || plan.days !== plan.months * 30;
  });
  if (hasInvalidDuration) {
    return NextResponse.json({ error: "duration must match the immutable product code" }, { status: 400 });
  }

  const plansByCode = new Map(parsed.data.plans.map((plan) => [plan.code, plan]));
  const orderedPlans = PLAN_CODES.map((code) => plansByCode.get(code)!);
  if (!isValidPlanPriceLadder(orderedPlans)) {
    return NextResponse.json({ error: "prices must increase with duration" }, { status: 400 });
  }

  const db = adminClient();
  const { error } = await db.rpc("admin_update_duration_pricing", {
    p_plans: orderedPlans.map(({ code, label, price }) => ({ code, label, price })),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
