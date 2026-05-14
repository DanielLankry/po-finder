import { adminClient } from "./supabase/admin";
import { PLANS } from "./plans";
import type { Plan } from "./plans";

export async function getPlans(): Promise<Plan[]> {
  try {
    const db = adminClient();
    const { data, error } = await db
      .from("plans")
      .select("days, label, price")
      .order("sort_order", { ascending: true });
    if (error || !data?.length) return [...PLANS];
    return data as Plan[];
  } catch {
    return [...PLANS];
  }
}

export async function getPlanByDays(days: number): Promise<Plan | null> {
  const plans = await getPlans();
  return plans.find((p) => p.days === days) ?? null;
}
