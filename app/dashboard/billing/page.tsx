import { getPlans } from "@/lib/plans-server";
import BillingClient from "./BillingClient";

export default async function BillingPage() {
  const plans = await getPlans();
  return <BillingClient plans={plans} nowIso={new Date().toISOString()} />;
}
