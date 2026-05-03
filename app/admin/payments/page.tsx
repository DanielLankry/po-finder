"use client";

import { useEffect, useState } from "react";
import { CreditCard, RotateCcw } from "lucide-react";

interface Attempt {
  id: string;
  user_id: string;
  business_id: string | null;
  plan_days: number;
  amount_agorot: number;
  status: "pending" | "succeeded" | "failed" | "refunded";
  hyp_transaction_id: string | null;
  hyp_card_mask: string | null;
  hyp_response_code: string | null;
  created_at: string;
  completed_at: string | null;
  user_email: string | null;
  business_name: string | null;
}

export default function AdminPaymentsPage() {
  const [items, setItems] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refundingId, setRefundingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/payments", { credentials: "same-origin" });
    if (r.ok) {
      const d = await r.json();
      setItems(d.items ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function refund(id: string) {
    if (!confirm("לבטל את העסקה ולסמן כהוחזרה?")) return;
    setRefundingId(id);
    const r = await fetch(`/api/admin/payments/${id}/refund`, {
      method: "POST",
      credentials: "same-origin",
    });
    const d = await r.json();
    if (!r.ok) {
      alert(`שגיאה: ${d.error ?? "unknown"}\n${d.raw ?? ""}`);
    }
    setRefundingId(null);
    load();
  }

  const fmt = (a: number) => `₪${(a / 100).toFixed(2)}`;
  const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleString("he-IL") : "—");
  const statusBadge = (s: Attempt["status"]) => {
    const map: Record<Attempt["status"], string> = {
      pending: "bg-stone-100 text-stone-700",
      succeeded: "bg-emerald-100 text-[#059669]",
      failed: "bg-red-100 text-red-700",
      refunded: "bg-amber-100 text-amber-700",
    };
    const label: Record<Attempt["status"], string> = {
      pending: "ממתין",
      succeeded: "שולם",
      failed: "נכשל",
      refunded: "הוחזר",
    };
    return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${map[s]}`}>{label[s]}</span>;
  };

  return (
    <div className="p-4 md:p-8" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-[#ECFDF5] flex items-center justify-center">
          <CreditCard className="h-5 w-5 text-[#059669]" />
        </div>
        <div>
          <h1 className="font-extrabold text-2xl text-[#111]">תשלומים</h1>
          <p className="text-[#888] text-sm">היסטוריית עסקאות מ-HYP</p>
        </div>
      </div>

      {loading ? (
        <p className="text-stone-500 text-sm">טוען...</p>
      ) : items.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center text-stone-500 text-sm">
          אין עדיין תשלומים
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F9FAFB] text-xs text-[#888] font-bold">
                <tr>
                  <th className="text-right px-4 py-3">תאריך</th>
                  <th className="text-right px-4 py-3">משתמש</th>
                  <th className="text-right px-4 py-3">עסק</th>
                  <th className="text-right px-4 py-3">תקופה</th>
                  <th className="text-right px-4 py-3">סכום</th>
                  <th className="text-right px-4 py-3">סטטוס</th>
                  <th className="text-right px-4 py-3">HYP</th>
                  <th className="text-right px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {items.map((a) => (
                  <tr key={a.id} className="hover:bg-[#FAFAF7]">
                    <td className="px-4 py-3 text-[#444] whitespace-nowrap" dir="ltr">{fmtDate(a.completed_at ?? a.created_at)}</td>
                    <td className="px-4 py-3 text-[#444]">{a.user_email ?? a.user_id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-[#444]">{a.business_name ?? "—"}</td>
                    <td className="px-4 py-3 text-[#444]">{a.plan_days} ימים</td>
                    <td className="px-4 py-3 font-semibold text-[#111]">{fmt(a.amount_agorot)}</td>
                    <td className="px-4 py-3">{statusBadge(a.status)}</td>
                    <td className="px-4 py-3 text-xs text-[#888]" dir="ltr">
                      {a.hyp_transaction_id ?? "—"}
                      {a.hyp_card_mask && <div className="text-[10px]">****{a.hyp_card_mask}</div>}
                    </td>
                    <td className="px-4 py-3">
                      {a.status === "succeeded" && (
                        <button
                          onClick={() => refund(a.id)}
                          disabled={refundingId === a.id}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                        >
                          <RotateCcw className="h-3 w-3" />
                          {refundingId === a.id ? "..." : "החזר"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
