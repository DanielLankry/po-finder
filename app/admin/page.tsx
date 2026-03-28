import { createClient } from "@/lib/supabase/server";
import { Store, Clock, CheckCircle, Ticket } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();

  const [
    { count: total },
    { count: pending },
    { count: active },
    { count: coupons },
  ] = await Promise.all([
    supabase.from("businesses").select("*", { count: "exact", head: true }),
    supabase.from("businesses").select("*", { count: "exact", head: true }).eq("is_active", false),
    supabase.from("businesses").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("coupons").select("*", { count: "exact", head: true }).eq("is_active", true),
  ]);

  const cards = [
    { label: "סה״כ עסקים", value: total ?? 0, icon: Store, color: "#059669", bg: "#ECFDF5" },
    { label: "ממתינים לאישור", value: pending ?? 0, icon: Clock, color: "#D97706", bg: "#FEF3C7" },
    { label: "עסקים פעילים", value: active ?? 0, icon: CheckCircle, color: "#059669", bg: "#ECFDF5" },
    { label: "קופונים פעילים", value: coupons ?? 0, icon: Ticket, color: "#7C3AED", bg: "#EDE9FE" },
  ];

  return (
    <div className="p-8" dir="rtl">
      <h1 className="font-extrabold text-2xl text-[#111] mb-6">ברוך הבא 👋</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
              <Icon className="h-5 w-5" style={{ color }} />
            </div>
            <p className="text-3xl font-extrabold text-[#111]">{value}</p>
            <p className="text-[#888] text-sm mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
