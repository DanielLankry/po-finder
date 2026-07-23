import { adminClient } from "./supabase/admin";
import { PLAN_CODES, PLANS, resolvePlanCatalog } from "./plans";
import type { Plan, PlanCandidate, PlanCode, PlanKind } from "./plans";

interface PlanRow {
  code: PlanCode;
  kind: PlanKind;
  days: number;
  duration_months: number | null;
  boost_days: number;
  label: string;
  price: number;
  is_active: boolean;
  max_redemptions: number | null;
  requires_verification: boolean;
}

function mapPlan(row: PlanRow): PlanCandidate {
  return {
    code: row.code,
    kind: row.kind,
    months: row.duration_months,
    days: row.days,
    boostDays: row.boost_days,
    label: row.label,
    price: row.price,
    isActive: row.is_active,
    maxRedemptions: row.max_redemptions,
    requiresVerification: row.requires_verification,
  };
}

export async function getPlans(): Promise<Plan[]> {
  try {
    const db = adminClient();
    const { data, error } = await db
      .from("plans")
      .select(
        "code, kind, days, duration_months, boost_days, label, price, is_active, max_redemptions, requires_verification"
      )
      .eq("is_active", true)
      .in("code", [...PLAN_CODES])
      .order("sort_order", { ascending: true });
    if (error || !data?.length) return [...PLANS];
    const databasePlans = (data as PlanRow[]).map(mapPlan);
    return resolvePlanCatalog(databasePlans);
  } catch {
    return [...PLANS];
  }
}

export async function getPlanByCode(code: PlanCode): Promise<Plan | null> {
  const plans = await getPlans();
  return plans.find((plan) => plan.code === code) ?? null;
}

// Kept for admin/reporting callers that group products by entitlement type.
export async function getPlanByKind(kind: PlanKind): Promise<Plan | null> {
  const plans = await getPlans();
  return plans.find((plan) => plan.kind === kind) ?? null;
}

export async function getPlanByDays(days: number): Promise<Plan | null> {
  const plans = await getPlans();
  return plans.find((plan) => plan.days === days) ?? null;
}
