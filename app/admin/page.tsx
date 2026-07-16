import { adminClient } from "@/lib/supabase/admin";
import { Store, Clock, CheckCircle, Ticket, Sparkles, Banknote, CreditCard, Hand } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  succeeded: { label: "הצליח", cls: "bg-emerald-100 text-[#2D6A4F]" },
  pending:   { label: "ממתין", cls: "bg-stone-100 text-stone-600" },
  failed:    { label: "נכשל",  cls: "bg-red-100 text-red-700" },
  refunded:  { label: "הוחזר", cls: "bg-amber-100 text-amber-700" },
};

export default async function AdminPage() {
  const admin = adminClient();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const nowIso = new Date().toISOString();

  const [
    { count: total },
    { count: pending },
    { count: active },
    { count: coupons },
    { data: monthPayments },
    { data: recentPayments },
  ] = await Promise.all([
    admin.from("businesses").select("*", { count: "exact", head: true }),
    admin.from("businesses").select("*", { count: "exact", head: true }).eq("is_verified", false),
    admin.from("businesses").select("*", { count: "exact", head: true }).eq("is_verified", true).eq("is_active", true).or(`is_legacy_public.eq.true,expires_at.gt.${nowIso}`),
    admin.from("coupons").select("*", { count: "exact", head: true }),
    admin
      .from("payment_attempts")
      .select("amount_agorot")
      .eq("status", "succeeded")
      .gte("completed_at", monthStart.toISOString()),
    admin
      .from("payment_attempts")
      .select("id, amount_agorot, kind, status, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const revenueMonth = (monthPayments ?? []).reduce(
    (sum, p) => sum + (p.amount_agorot ?? 0),
    0
  );

  const cards = [
    { label: "סה״כ עסקים", value: total ?? 0, icon: Store, color: "#2D6A4F", bg: "#EFF5F0" },
    { label: "ממתינים לאישור", value: pending ?? 0, icon: Clock, color: "#D97706", bg: "#FEF3C7" },
    { label: "עסקים פעילים", value: active ?? 0, icon: CheckCircle, color: "#2D6A4F", bg: "#EFF5F0" },
    { label: "הכנסות החודש", value: `₪${Math.round(revenueMonth / 100)}`, icon: Banknote, color: "#2D6A4F", bg: "#EFF5F0" },
    { label: "רשומות קופון היסטוריות", value: coupons ?? 0, icon: Ticket, color: "#7C3AED", bg: "#EDE9FE" },
  ];

  return (
    <div className="p-4 md:p-8" dir="rtl">
      <h1 className="mb-6 flex items-center gap-2 font-display text-3xl text-[#17402D]">ברוך הבא <Hand className="h-6 w-6 text-[#C4552D]" aria-hidden="true" /></h1>
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="brand-panel-soft bg-[#FFFDF7] p-5 md:p-6">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
              <Icon className="h-5 w-5" style={{ color }} />
            </div>
            <p className="text-2xl md:text-3xl font-extrabold text-[#111]">{value}</p>
            <p className="text-[#888] text-sm mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent payments */}
      <div className="brand-panel mt-6 overflow-hidden bg-[#FFFDF7]">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-[#E5E7EB] bg-[#F9FAFB]">
          <CreditCard className="h-4 w-4 text-[#888]" />
          <span className="text-xs font-bold text-[#888]">תשלומים אחרונים</span>
        </div>
        {!recentPayments?.length ? (
          <div className="p-6 text-center text-[#AAA] text-sm">אין תשלומים עדיין</div>
        ) : (
          <div className="divide-y divide-[#F5F5F5]">
            {recentPayments.map((p) => {
              const status = STATUS_META[p.status] ?? STATUS_META.pending;
              return (
                <div key={p.id} className="px-4 md:px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        p.kind === "boost" ? "bg-amber-100 text-amber-800" : "bg-[#EFF5F0] text-[#1F5038]"
                      }`}
                    >
                      {p.kind === "boost" ? <Sparkles className="h-3 w-3" /> : <Store className="h-3 w-3" />}
                      {p.kind === "boost" ? "קידום" : "רישום"}
                    </span>
                    <span className="font-bold text-[#111] text-sm">₪{Math.round(p.amount_agorot / 100)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.cls}`}>
                      {status.label}
                    </span>
                    <span className="text-xs text-[#888]" dir="ltr">
                      {new Date(p.created_at).toLocaleDateString("he-IL")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
