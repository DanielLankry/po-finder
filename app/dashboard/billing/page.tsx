import { getPlans } from "@/lib/plans-server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { getOwnerPaymentTransientState } from "@/lib/owner-lifecycle";
import type { OwnerPaymentTransientState } from "@/lib/owner-lifecycle";
import BillingClient from "./BillingClient";
import type { PurchaseEvent } from "./BillingClient";

type BillingSearchParams = Promise<{
  attempt?: string | string[];
}>;

type BillingPaymentContext = {
  state: OwnerPaymentTransientState | null;
  purchaseEvent: PurchaseEvent | null;
};

/** Resolves display and analytics state from a payment owned by the signed-in user. */
async function getBillingPaymentContext(
  searchParams: BillingSearchParams
): Promise<BillingPaymentContext | null> {
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
    .select("id, product_code, amount_agorot, status, hyp_response_code")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return null;

  return {
    state: getOwnerPaymentTransientState(data),
    purchaseEvent:
      data.status === "succeeded"
        ? {
            id: data.id,
            planCode: data.product_code,
            value: data.amount_agorot / 100,
            currency: "ILS",
          }
        : null,
  };
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: BillingSearchParams;
}) {
  const plans = await getPlans();
  const paymentContext = await getBillingPaymentContext(searchParams);
  return (
    <BillingClient
      plans={plans}
      nowIso={new Date().toISOString()}
      paymentState={paymentContext?.state ?? null}
      purchaseEvent={paymentContext?.purchaseEvent ?? null}
    />
  );
}
