"use client";

import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, Ticket, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/coupons");
    if (res.ok) {
      const data = await res.json();
      setCoupons(data);
    }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  /** Deactivates a legacy row while issuance remains intentionally unavailable. */
  async function deactivateCoupon(id: string) {
    setActionError("");
    const response = await fetch(`/api/admin/coupons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: false }),
    });
    if (!response.ok) {
      setActionError("לא ניתן היה להשבית את רשומת הקופון.");
      return;
    }
    setCoupons((prev) => prev.map((coupon) =>
      coupon.id === id ? { ...coupon, is_active: false } : coupon
    ));
  }

  async function deleteCoupon(id: string) {
    if (!confirm("בטוח למחוק את הקופון?")) return;
    setActionError("");
    const response = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setActionError("לא ניתן היה למחוק את רשומת הקופון.");
      return;
    }
    setCoupons((prev) => prev.filter((c) => c.id !== id));
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="h-10 w-10 rounded-full border-4 border-purple-200 border-t-[#7C3AED] animate-spin" />
    </div>
  );

  return (
    <div className="p-8" dir="rtl">
      <div className="mb-6">
        <div>
          <h1 className="font-extrabold text-2xl text-[#111]">קופונים</h1>
          <p className="text-[#888] text-sm">{coupons.length} רשומות שמורות לניקוי או השבתה</p>
        </div>
      </div>

      <div role="status" className="mb-6 flex items-start gap-3 rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          <strong>מימוש קופונים אינו מחובר לצ׳קאוט.</strong>{" "}
          יצירה והפעלה חסומות כדי שלא להציג הנחה שלא תיתן בפועל.
          אפשר רק להשבית או למחוק רשומות ישנות.
        </p>
      </div>

      {actionError ? (
        <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
          {actionError}
        </p>
      ) : null}

      {/* Coupons Table */}
      {coupons.length === 0 ? (
        <div className="text-center py-16 text-[#AAA]">
          <Ticket className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>אין קופונים עדיין</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <th className="text-right px-5 py-3 text-xs font-semibold text-[#888]">קוד</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-[#888]">סוג</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-[#888]">ערך</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-[#888]">שימושים</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-[#888]">תפוגה</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-[#888]">מצב הרשומה</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-[#888]">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b border-[#F3F4F6] hover:bg-[#F7F3EA] transition-colors">
                  <td className="px-5 py-4 font-mono font-bold text-[#111]">{c.code}</td>
                  <td className="px-5 py-4 text-sm text-[#555]">{c.type === "percent" ? "אחוז" : "קבוע"}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-[#7C3AED]">
                    {c.type === "percent" ? `${c.value}%` : `₪${c.value}`}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#555]">
                    {c.uses_count}{c.max_uses ? `/${c.max_uses}` : ""}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#888]">
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString("he-IL") : "—"}
                  </td>
                  <td className="px-5 py-4">
                    {c.is_active ? (
                      <button onClick={() => deactivateCoupon(c.id)} title="השבתת הרשומה" aria-label={`השבתת ${c.code}`}>
                        <ToggleRight className="h-6 w-6 text-[#2D6A4F]" />
                      </button>
                    ) : (
                      <span title="הפעלה אינה זמינה">
                        <ToggleLeft className="h-6 w-6 text-[#CCC]" />
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => deleteCoupon(c.id)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
