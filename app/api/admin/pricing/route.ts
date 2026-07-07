import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/admin-session";
import { adminClient } from "@/lib/supabase/admin";
import { getPlans } from "@/lib/plans-server";

export const runtime = "nodejs";

const planSchema = z.object({
  kind:  z.enum(["listing", "boost"]),
  days:  z.number().int().positive(),
  label: z.string().min(1).max(100),
  price: z.number().int().positive(),
});

const pricingSchema = z
  .object({
    plans: z.array(planSchema).length(2),
  })
  .refine(
    (v) =>
      v.plans.some((p) => p.kind === "listing") &&
      v.plans.some((p) => p.kind === "boost"),
    { message: "נדרשת בדיוק תוכנית רישום אחת ותוכנית קידום אחת" }
  );

async function isAuthed(req: NextRequest) {
  return isAdminRequest(req);
}

export async function GET(req: NextRequest) {
  if (!(await isAuthed(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const plans = await getPlans();
  return NextResponse.json({ plans });
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = pricingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { plans } = parsed.data;

  const db = adminClient();

  // Replace all plans atomically: delete then insert.
  const { error: delErr } = await db.from("plans").delete().gte("id", 0);
  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  const rows = plans.map((p, i) => ({ sort_order: i, kind: p.kind, days: p.days, label: p.label, price: p.price }));
  const { error: insErr } = await db.from("plans").insert(rows);
  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
