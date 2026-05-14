import { getPlans } from "@/lib/plans-server";
import PricingEditor from "./PricingEditor";

export default async function AdminPricingPage() {
  const plans = await getPlans();
  return <PricingEditor initialPlans={plans} />;
}
