import { createClient } from "@/lib/supabase/server";
import { BarChart3, TrendingUp, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminStatsPage() {
  const supabase = await createClient();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalBiz },
    { count: activeBiz },
    { count: last30 },
    { count: last7 },
    { data: categories },
  ] = await Promise.all([
    supabase.from("businesses").select("*", { count: "exact", head: true }),
    supabase.from("businesses").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("businesses").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
    supabase.from("businesses").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    supabase.from("businesses").select("category"),
  ]);

  // Count by category
  const catCounts: Record<string, number> = {};
  (categories ?? []).forEach((b: { category: string }) => {
    catCounts[b.category] = (catCounts[b.category] || 0) + 1;
  });
  const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="p-8" dir="rtl">
      <h1 className="font-extrabold text-2xl text-[#111] mb-6">סטטיסטיקות</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "סה״כ עסקים", value: totalBiz ?? 0, icon: BarChart3, color: "#059669", bg: "#ECFDF5" },
          { label: "עסקים פעילים", value: activeBiz ?? 0, icon: TrendingUp, color: "#059669", bg: "#ECFDF5" },
          { label: "נרשמו ב-30 יום", value: last30 ?? 0, icon: Calendar, color: "#2563EB", bg: "#DBEAFE" },
          { label: "נרשמו ב-7 ימים", value: last7 ?? 0, icon: Calendar, color: "#7C3AED", bg: "#EDE9FE" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
              <Icon className="h-5 w-5" style={{ color }} />
            </div>
            <p className="text-3xl font-extrabold text-[#111]">{value}</p>
            <p className="text-[#888] text-sm mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm">
        <h2 className="font-bold text-lg text-[#111] mb-4">עסקים לפי קטגוריה</h2>
        <div className="space-y-3">
          {sortedCats.map(([cat, count]) => {
            const pct = totalBiz ? Math.round((count / (totalBiz as number)) * 100) : 0;
            return (
              <div key={cat}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#555] font-medium">{cat}</span>
                  <span className="text-[#888]">{count} ({pct}%)</span>
                </div>
                <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                  <div className="h-full bg-[#059669] rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
