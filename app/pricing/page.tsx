import { getPlans } from "@/lib/plans-server";
import PricingClient from "./PricingClient";

export default async function PricingPage() {
  const plans = await getPlans();
  return <PricingClient plans={plans} />;
}
