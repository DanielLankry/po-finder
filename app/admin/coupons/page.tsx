"use client";

import { useEffect, useState, useCallback } from "react";
import { Ticket, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

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
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", type: "percent" as "percent" | "fixed", value: 10, max_uses: "", expires_at: "" });
  const [saving, setSaving] = useState(false);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/coupons");
    if (res.ok) {
      const data = await res.json();
      setCoupons(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  function generateCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "POK-";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setForm((f) => ({ ...f, code }));
  }

  async function createCoupon(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const body: Record<string, unknown> = {
      code: form.code.toUpperCase(),
      type: form.type,
      value: form.value,
    };
    if (form.max_uses) body.max_uses = parseInt(form.max_uses);
    if (form.expires_at) body.expires_at = new Date(form.expires_at).toISOString();

    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setForm({ code: "", type: "percent", value: 10, max_uses: "", expires_at: "" });
      setShowForm(false);
      fetchCoupons();
    } else {
      const err = await res.json();
      alert(err.error || "שגיאה ביצירת קופון");
    }
    setSaving(false);
  }

  async function toggleActive(id: string, currentActive: boolean) {
    await fetch(`/api/admin/coupons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !currentActive }),
    });
    setCoupons((prev) => prev.map((c) => c.id === id ? { ...c, is_active: !currentActive } : c));
  }

  async function deleteCoupon(id: string) {
    if (!confirm("בטוח למחוק את הקופון?")) return;
    await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    setCoupons((prev) => prev.filter((c) => c.id !== id));
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="h-10 w-10 rounded-full border-4 border-purple-200 border-t-[#7C3AED] animate-spin" />
    </div>
  );

  return (
    <div className="p-8" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-extrabold text-2xl text-[#111]">קופונים</h1>
          <p className="text-[#888] text-sm">{coupons.filter((c) => c.is_active).length} פעילים מתוך {coupons.length}</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); if (!showForm) generateCode(); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm transition-colors"
          style={{ background: "linear-gradient(135deg, #7C3AED, #6D28D9)" }}
        >
          <Plus className="h-4 w-4" />
          קופון חדש
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={createCoupon} className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm mb-6">
          <h3 className="font-bold text-[#111] mb-4">יצירת קופון חדש</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#555] mb-1">קוד</label>
              <div className="flex gap-2">
                <input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  required
                  className="flex-1 h-10 rounded-lg border border-[#E5E7EB] bg-[#FAFAF7] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  placeholder="POK-XXXXX"
                />
                <button type="button" onClick={generateCode} className="h-10 px-3 rounded-lg border border-[#E5E7EB] text-xs text-[#555] hover:bg-[#F9F9F9]">
                  ייצר
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#555] mb-1">סוג</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "percent" | "fixed" }))}
                className="w-full h-10 rounded-lg border border-[#E5E7EB] bg-[#FAFAF7] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
              >
                <option value="percent">אחוז הנחה (%)</option>
                <option value="fixed">סכום קבוע (₪)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#555] mb-1">ערך</label>
              <input
                type="number"
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: parseInt(e.target.value) || 0 }))}
                required
                min={1}
                className="w-full h-10 rounded-lg border border-[#E5E7EB] bg-[#FAFAF7] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#555] mb-1">מקסימום שימושים</label>
              <input
                type="number"
                value={form.max_uses}
                onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))}
                placeholder="ללא הגבלה"
                min={1}
                className="w-full h-10 rounded-lg border border-[#E5E7EB] bg-[#FAFAF7] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[#555] mb-1">תאריך תפוגה</label>
              <input
                type="datetime-local"
                value={form.expires_at}
                onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                className="w-full h-10 rounded-lg border border-[#E5E7EB] bg-[#FAFAF7] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #7C3AED, #6D28D9)" }}
            >
              {saving ? "שומר..." : "צור קופון"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-xl border border-[#E5E7EB] text-sm text-[#555]">
              ביטול
            </button>
          </div>
        </form>
      )}

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
                <th className="text-right px-5 py-3 text-xs font-semibold text-[#888]">סטטוס</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-[#888]">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b border-[#F3F4F6] hover:bg-[#FAFAF7] transition-colors">
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
                    <button onClick={() => toggleActive(c.id, c.is_active)} title="החלף סטטוס">
                      {c.is_active ? (
                        <ToggleRight className="h-6 w-6 text-[#059669]" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-[#CCC]" />
                      )}
                    </button>
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
