import { getPlans } from "@/lib/plans-server";
import PricingEditor from "./PricingEditor";

export const dynamic = "force-dynamic";

export default async function AdminPricingPage() {
  const plans = await getPlans();
  return <PricingEditor initialPlans={plans} />;
}
