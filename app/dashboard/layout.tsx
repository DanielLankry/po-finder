import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

export const metadata = { title: "לוח בקרה — פה" };

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/dashboard");
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
