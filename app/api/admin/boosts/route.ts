import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/admin-session";
import { adminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Admin boost management.
 * GET  → all businesses with boost state + this-month boost revenue.
 * POST → { businessId, action: 'grant' | 'revoke' }
 *        grant  = extend boost_expires_at from max(now, current) + 30 days
 *        revoke = clear boost_expires_at
 */
export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = adminClient();

  const { data: businesses, error } = await db
    .from("businesses")
    .select("id, name, boost_expires_at, is_active")
    .order("boost_expires_at", { ascending: false, nullsFirst: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const { data: payments, error: payErr } = await db
    .from("payment_attempts")
    .select("amount_agorot")
    .eq("status", "succeeded")
    .eq("kind", "boost")
    .gte("completed_at", monthStart.toISOString());
  if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 });

  const revenueAgorot = (payments ?? []).reduce((sum, p) => sum + p.amount_agorot, 0);
  return NextResponse.json({ businesses: businesses ?? [], revenueAgorot });
}

const actionSchema = z.object({
  businessId: z.string().uuid(),
  action: z.enum(["grant", "revoke"]),
});

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = actionSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const db = adminClient();
  const { businessId, action } = parsed.data;

  if (action === "revoke") {
    const { error } = await db
      .from("businesses")
      .update({ boost_expires_at: null })
      .eq("id", businessId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // grant: extend from max(now, current) + 30 days.
  const { data: biz, error: readErr } = await db
    .from("businesses")
    .select("boost_expires_at")
    .eq("id", businessId)
    .single();
  if (readErr || !biz) {
    return NextResponse.json({ error: "business not found" }, { status: 404 });
  }

  const baseMs = biz.boost_expires_at
    ? Math.max(Date.parse(biz.boost_expires_at), Date.now())
    : Date.now();
  const newExpiry = new Date(baseMs + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await db
    .from("businesses")
    .update({ boost_expires_at: newExpiry })
    .eq("id", businessId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, boost_expires_at: newExpiry });
}
