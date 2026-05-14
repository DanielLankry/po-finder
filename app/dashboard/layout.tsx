import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

export const metadata = { title: "לוח בקרה" };

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/dashboard");
  }

  // Paywall: dashboard is for users with any meaningful relationship to the
  // paid side of the product. Access is granted if any of:
  //   (a) they own a business with expires_at > now() (active subscription)
  //   (b) they have a paid-but-unconsumed payment_attempt waiting to be linked
  //       to a business they're about to create (lib/migrations/017 trigger)
  //   (c) they own any business at all — even if the period expired or the
  //       listing is still pending admin approval. /dashboard/billing is where
  //       they renew; locking them out of their own dashboard would force them
  //       to re-pay before they can even see the renewal screen.
  const nowIso = new Date().toISOString();

  const { data: activeBiz } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .gt("expires_at", nowIso)
    .limit(1)
    .maybeSingle();

  let hasAccess = !!activeBiz;

  if (!hasAccess) {
    const { data: unconsumed } = await supabase
      .from("payment_attempts")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "succeeded")
      .is("business_id", null)
      .limit(1)
      .maybeSingle();
    hasAccess = !!unconsumed;
  }

  if (!hasAccess) {
    const { data: anyBiz } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle();
    hasAccess = !!anyBiz;
  }

  if (!hasAccess) {
    redirect("/pricing?reason=no_subscription");
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-surface pt-[72px]" dir="rtl">
        <div className="max-w-[1280px] mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            <DashboardSidebar />
            <main className="flex-1 min-w-0" id="dashboard-content">
              {children}
            </main>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
