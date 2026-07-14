import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { getDashboardAccessForUser } from "@/lib/dashboard-access";

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
  //   (a) they own a business with expires_at > now() (active listing)
  //   (b) they have a paid-but-unconsumed payment_attempt waiting to be linked
  //       to a business they're about to create (lib/migrations/017 trigger)
  //   (c) they own any business at all — even if the period expired or the
  //       listing is still pending admin approval. /dashboard/billing is where
  //       they renew; locking them out of their own dashboard would force them
  //       to re-pay before they can even see the renewal screen.
  const { hasAccess } = await getDashboardAccessForUser(user.id);

  if (!hasAccess) {
    redirect("/pricing?reason=no_subscription");
  }

  return (
    <>
      <Navbar />
      <div className="brand-canvas min-h-screen pt-[72px]" dir="rtl">
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
