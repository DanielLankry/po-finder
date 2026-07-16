import { getPlans } from "@/lib/plans-server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import BillingClient from "./BillingClient";
import type { PurchaseEvent } from "./BillingClient";

type BillingSearchParams = Promise<{
  attempt?: string | string[];
}>;

/** Loads a succeeded payment owned by the signed-in user for safe Purchase tracking. */
async function getPurchaseEvent(
  searchParams: BillingSearchParams
): Promise<PurchaseEvent | null> {
  const attemptedId = (await searchParams).attempt;
  const attemptId = Array.isArray(attemptedId) ? attemptedId[0] : attemptedId;
  if (!attemptId) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await adminClient()
    .from("payment_attempts")
    .select("id, product_code, amount_agorot")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .eq("status", "succeeded")
    .maybeSingle();
  if (!data) return null;

  return {
    id: data.id,
    planCode: data.product_code,
    value: data.amount_agorot / 100,
    currency: "ILS",
  };
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: BillingSearchParams;
}) {
  const plans = await getPlans();
  const purchaseEvent = await getPurchaseEvent(searchParams);
  return (
    <BillingClient
      plans={plans}
      nowIso={new Date().toISOString()}
      purchaseEvent={purchaseEvent}
    />
  );
}
