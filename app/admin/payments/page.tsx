"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CreditCard, RefreshCw, RotateCcw } from "lucide-react";

interface Attempt {
  id: string;
  user_id: string;
  business_id: string | null;
  product_code: string;
  plan_days: number;
  duration_months: number | null;
  amount_agorot: number;
  service_status: string | null;
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
  const [loadError, setLoadError] = useState("");
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [serviceUpdatingId, setServiceUpdatingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch("/api/admin/payments", { credentials: "same-origin" });
      const body = await response.json().catch(() => ({}));
      if (response.ok) setItems(body.items ?? []);
      else setLoadError(body.error ?? "שגיאה בטעינת התשלומים");
    } catch {
      setLoadError("לא ניתן לטעון את התשלומים. בדקו את החיבור ונסו שוב.");
    } finally {
      setLoading(false);
    }
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
      alert(`שגיאה: ${d.error ?? "unknown"}\n${d.detail ?? d.raw ?? ""}`);
    }
    setRefundingId(null);
    load();
  }

  async function updateServiceStatus(id: string, serviceStatus: string) {
    setServiceUpdatingId(id);
    const response = await fetch(`/api/admin/payments/${id}/service`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceStatus }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      alert(`שגיאה: ${body.error ?? "unknown"}`);
    } else {
      setItems((current) => current.map((item) => item.id === id ? { ...item, service_status: serviceStatus } : item));
    }
    setServiceUpdatingId(null);
  }

  const fmt = (a: number) => `₪${(a / 100).toFixed(2)}`;
  const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleString("he-IL") : "—");
  const pendingCount = items.filter((item) => item.status === "pending").length;
  const statusBadge = (s: Attempt["status"]) => {
    const map: Record<Attempt["status"], string> = {
      pending: "bg-stone-100 text-stone-700",
      succeeded: "bg-emerald-100 text-[#2D6A4F]",
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#EFF5F0] flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-[#2D6A4F]" />
          </div>
          <div>
            <h1 className="font-extrabold text-2xl text-[#111]">תשלומים</h1>
            <p className="text-[#888] text-sm">היסטוריית עסקאות מ-HYP</p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-[#17402D]/25 bg-white px-4 text-sm font-bold text-[#17402D] disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> רענון
        </button>
      </div>

      {loadError ? (
        <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {loadError}
        </p>
      ) : null}

      {pendingCount > 0 ? (
        <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            <strong>{pendingCount} עסקאות עדיין ממתינות.</strong> מזהה Order מוצג בטבלה לצורך בדיקה מול HYP.
            אין לסמן עסקה כשולמה לפי זמן או אישור לקוח בלבד; נדרש אימות דרך מערכת הסליקה.
          </p>
        </div>
      ) : null}

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
                  <th className="text-right px-4 py-3">מוצר</th>
                  <th className="text-right px-4 py-3">סכום</th>
                  <th className="text-right px-4 py-3">סטטוס</th>
                  <th className="text-right px-4 py-3">HYP</th>
                  <th className="text-right px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {items.map((a) => (
                  <tr key={a.id} className="hover:bg-[#F7F3EA]">
                    <td className="px-4 py-3 text-[#444] whitespace-nowrap" dir="ltr">{fmtDate(a.completed_at ?? a.created_at)}</td>
                    <td className="px-4 py-3 text-[#444]">{a.user_email ?? a.user_id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-[#444]">{a.business_name ?? "—"}</td>
                    <td className="px-4 py-3 text-[#444]">
                      <span className="font-mono text-xs" dir="ltr">{a.product_code}</span>
                      <div className="text-[10px] text-[#888]">
                        {a.duration_months ? `${a.duration_months} חודשים` : `${a.plan_days} ימים`}
                      </div>
                      {a.service_status ? (
                        <select
                          value={a.service_status}
                          disabled={serviceUpdatingId === a.id}
                          onChange={(event) => updateServiceStatus(a.id, event.target.value)}
                          className="mt-1 rounded-lg border border-stone-300 bg-white px-2 py-1 text-[11px]"
                          aria-label="סטטוס שירות השקה בליווי"
                        >
                          <option value="pending">ממתין</option>
                          <option value="contacted">נוצר קשר</option>
                          <option value="in_progress">בטיפול</option>
                          <option value="completed">הושלם</option>
                          <option value="cancelled">בוטל</option>
                        </select>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#111]">{fmt(a.amount_agorot)}</td>
                    <td className="px-4 py-3">{statusBadge(a.status)}</td>
                    <td className="px-4 py-3 text-xs text-[#888]" dir="ltr">
                      <div>Order: {a.id}</div>
                      <div>{a.hyp_transaction_id ? `Trans: ${a.hyp_transaction_id}` : "Trans: —"}</div>
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
