import { getPlans } from "@/lib/plans-server";
import PricingClient from "./PricingClient";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const plans = await getPlans();
  return <PricingClient plans={plans} nowIso={new Date().toISOString()} />;
}
