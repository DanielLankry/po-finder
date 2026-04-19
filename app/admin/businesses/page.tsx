"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORY_LABELS, KASHRUT_LABELS } from "@/lib/types";
import type { BusinessCategory, KashrutStatus } from "@/lib/types";
import { CheckCircle, XCircle, Phone, ExternalLink, RefreshCw, Plus, X, Pencil } from "lucide-react";

interface Business {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  category: string;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  instagram: string | null;
  kashrut: string;
  business_number: string | null;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
}

const EMPTY_FORM = {
  name: "", description: "", category: "food" as BusinessCategory,
  phone: "", whatsapp: "", website: "", instagram: "",
  kashrut: "none" as KashrutStatus, business_number: "",
  address: "", lat: "32.0853", lng: "34.7818",
  duration_months: "1",
};

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editBiz, setEditBiz] = useState<Business | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("businesses")
      .select("*")
      .order("is_active", { ascending: true })
      .order("created_at", { ascending: false });
    setBusinesses(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function approve(businessId: string) {
    setActionLoading(businessId);
    const res = await fetch("/api/admin/businesses/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId }),
    });
    if (res.ok) setBusinesses((prev) => prev.map((b) => b.id === businessId ? { ...b, is_active: true } : b));
    else alert("שגיאה באישור העסק");
    setActionLoading(null);
  }

  async function deleteBiz(businessId: string) {
    if (!confirm("בטוח למחוק את העסק?")) return;
    setActionLoading(businessId);
    const res = await fetch(`/api/admin/businesses/${businessId}`, { method: "DELETE" });
    if (res.ok) setBusinesses((prev) => prev.filter((b) => b.id !== businessId));
    else alert("שגיאה במחיקה");
    setActionLoading(null);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    try {
      const supabase = createClient();
      const months = parseInt(form.duration_months) || 1;
      const expires = new Date();
      expires.setMonth(expires.getMonth() + months);

      // Use a system owner_id (admin placeholder)
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase.from("businesses").insert({
        owner_id: user?.id ?? "00000000-0000-0000-0000-000000000000",
        name: form.name,
        description: form.description || null,
        category: form.category,
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        website: form.website || null,
        instagram: form.instagram || null,
        kashrut: form.kashrut,
        business_number: form.business_number || null,
        address: form.address || null,
        lat: parseFloat(form.lat) || 32.0853,
        lng: parseFloat(form.lng) || 34.7818,
        is_active: true,
        expires_at: expires.toISOString(),
      }).select().single();

      if (error) throw error;
      setBusinesses((prev) => [data as Business, ...prev]);
      setForm(EMPTY_FORM);
      setShowAddForm(false);
    } catch (err) {
      alert("שגיאה: " + (err instanceof Error ? err.message : String(err)));
    }
    setAddLoading(false);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editBiz) return;
    setEditLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("businesses")
        .update({
          name: editBiz.name,
          description: editBiz.description,
          category: editBiz.category,
          phone: editBiz.phone,
          whatsapp: editBiz.whatsapp,
          website: editBiz.website,
          instagram: editBiz.instagram,
          kashrut: editBiz.kashrut,
          business_number: editBiz.business_number,
          address: editBiz.address,
          lat: editBiz.lat,
          lng: editBiz.lng,
        })
        .eq("id", editBiz.id)
        .select()
        .single();
      if (error) throw error;
      setBusinesses((prev) => prev.map((b) => b.id === editBiz.id ? data as Business : b));
      setEditBiz(null);
    } catch (err) {
      alert("שגיאה: " + (err instanceof Error ? err.message : String(err)));
    }
    setEditLoading(false);
  }

  const pending = businesses.filter((b) => !b.is_active);
  const active = businesses.filter((b) => b.is_active);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="h-10 w-10 rounded-full border-4 border-emerald-200 border-t-[#059669] animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="font-extrabold text-2xl text-[#111]">ניהול עסקים</h1>
          <p className="text-[#888] text-sm">{pending.length} ממתינים · {active.length} פעילים</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAll} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-[#E5E7EB] text-sm text-[#555] hover:bg-[#F9F9F9] transition-colors">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">רענן</span>
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold text-sm transition-colors"
            style={{ background: "linear-gradient(135deg, #059669, #047857)" }}
          >
            <Plus className="h-4 w-4" />
            הוסף עסק ידני
          </button>
        </div>
      </div>

      {/* Add Business Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setShowAddForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-[#E5E7EB]">
              <h2 className="font-bold text-lg text-[#111]">הוספת עסק ידני</h2>
              <button onClick={() => setShowAddForm(false)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-[#111] mb-1">שם העסק *</label>
                  <input required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]" placeholder="שם העסק" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1">קטגוריה</label>
                  <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value as BusinessCategory})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#059669]">
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1">כשרות</label>
                  <select value={form.kashrut} onChange={(e) => setForm({...form, kashrut: e.target.value as KashrutStatus})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#059669]">
                    {Object.entries(KASHRUT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1">טלפון</label>
                  <input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]" placeholder="050-0000000" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1">מספר עוסק</label>
                  <input value={form.business_number} onChange={(e) => setForm({...form, business_number: e.target.value})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]" placeholder="555555555" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-[#111] mb-1">כתובת</label>
                  <input value={form.address} onChange={(e) => setForm({...form, address: e.target.value})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]" placeholder="שוק הכרמל, תל אביב" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1">קו רוחב (lat)</label>
                  <input value={form.lat} onChange={(e) => setForm({...form, lat: e.target.value})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1">קו אורך (lng)</label>
                  <input value={form.lng} onChange={(e) => setForm({...form, lng: e.target.value})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]" dir="ltr" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-[#111] mb-1">תיאור</label>
                  <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={2}
                    className="w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] resize-none" placeholder="תיאור קצר..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1">אינסטגרם</label>
                  <input value={form.instagram} onChange={(e) => setForm({...form, instagram: e.target.value})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]" placeholder="username" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1">תוקף (חודשים)</label>
                  <select value={form.duration_months} onChange={(e) => setForm({...form, duration_months: e.target.value})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#059669]">
                    <option value="1">חודש</option><option value="3">3 חודשים</option>
                    <option value="6">חצי שנה</option><option value="12">שנה</option>
                    <option value="120">ללא הגבלה (10 שנים)</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={addLoading || !form.name}
                className="w-full h-12 rounded-xl text-white font-bold text-base disabled:opacity-50 transition-all"
                style={{ background: "linear-gradient(135deg, #059669, #047857)" }}>
                {addLoading ? "מוסיף..." : "הוסף עסק לאתר"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editBiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setEditBiz(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-[#E5E7EB]">
              <h2 className="font-bold text-lg text-[#111]">עריכת עסק — {editBiz.name}</h2>
              <button onClick={() => setEditBiz(null)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-[#111] mb-1">שם העסק *</label>
                  <input required value={editBiz.name} onChange={(e) => setEditBiz({...editBiz, name: e.target.value})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1">קטגוריה</label>
                  <select value={editBiz.category} onChange={(e) => setEditBiz({...editBiz, category: e.target.value})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#059669]">
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1">כשרות</label>
                  <select value={editBiz.kashrut} onChange={(e) => setEditBiz({...editBiz, kashrut: e.target.value})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#059669]">
                    {Object.entries(KASHRUT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1">טלפון</label>
                  <input value={editBiz.phone ?? ""} onChange={(e) => setEditBiz({...editBiz, phone: e.target.value})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1">WhatsApp</label>
                  <input value={editBiz.whatsapp ?? ""} onChange={(e) => setEditBiz({...editBiz, whatsapp: e.target.value})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-[#111] mb-1">כתובת</label>
                  <input value={editBiz.address ?? ""} onChange={(e) => setEditBiz({...editBiz, address: e.target.value})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1">קו רוחב (lat)</label>
                  <input value={editBiz.lat ?? ""} onChange={(e) => setEditBiz({...editBiz, lat: parseFloat(e.target.value) || null})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1">קו אורך (lng)</label>
                  <input value={editBiz.lng ?? ""} onChange={(e) => setEditBiz({...editBiz, lng: parseFloat(e.target.value) || null})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1">אתר</label>
                  <input value={editBiz.website ?? ""} onChange={(e) => setEditBiz({...editBiz, website: e.target.value})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1">אינסטגרם</label>
                  <input value={editBiz.instagram ?? ""} onChange={(e) => setEditBiz({...editBiz, instagram: e.target.value})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1">מספר עוסק</label>
                  <input value={editBiz.business_number ?? ""} onChange={(e) => setEditBiz({...editBiz, business_number: e.target.value})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-[#111] mb-1">תיאור</label>
                  <textarea value={editBiz.description ?? ""} onChange={(e) => setEditBiz({...editBiz, description: e.target.value})} rows={3}
                    className="w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] resize-none" />
                </div>
              </div>
              <button type="submit" disabled={editLoading}
                className="w-full h-12 rounded-xl text-white font-bold text-base disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #059669, #047857)" }}>
                {editLoading ? "שומר..." : "שמור שינויים"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Pending */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="font-bold text-lg text-[#D97706] mb-3">⏳ ממתינים לאישור ({pending.length})</h2>
          <div className="flex flex-col gap-3">
            {pending.map((biz) => (
              <BusinessCard key={biz.id} biz={biz} onApprove={approve} onDelete={deleteBiz} onEdit={setEditBiz} actionLoading={actionLoading} />
            ))}
          </div>
        </div>
      )}

      {/* Active */}
      <div>
        <h2 className="font-bold text-lg text-[#059669] mb-3">✅ עסקים פעילים ({active.length})</h2>
        {active.length === 0 ? (
          <p className="text-[#AAA] py-8 text-center">אין עסקים פעילים</p>
        ) : (
          <div className="flex flex-col gap-3">
            {active.map((biz) => (
              <BusinessCard key={biz.id} biz={biz} onApprove={approve} onDelete={deleteBiz} onEdit={setEditBiz} actionLoading={actionLoading} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BusinessCard({ biz, onApprove, onDelete, onEdit, actionLoading }: {
  biz: Business; onApprove: (id: string) => void;
  onDelete: (id: string) => void; onEdit: (b: Business) => void; actionLoading: string | null;
}) {
  const isLoading = actionLoading === biz.id;
  return (
    <div className={`bg-white rounded-2xl border p-4 md:p-5 shadow-sm ${biz.is_active ? "border-[#E5E7EB]" : "border-amber-200 bg-amber-50/30"}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="bg-[#059669] text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {CATEGORY_LABELS[biz.category as keyof typeof CATEGORY_LABELS] ?? biz.category}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${biz.is_active ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
              {biz.is_active ? "פעיל" : "ממתין"}
            </span>
          </div>
          <h2 className="font-bold text-[#111] text-base md:text-lg truncate">{biz.name}</h2>
          {biz.description && <p className="text-[#666] text-sm mt-0.5 line-clamp-1">{biz.description}</p>}
          <div className="flex flex-wrap gap-2 text-xs text-[#888] mt-1.5">
            {biz.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{biz.phone}</span>}
            {biz.address && <span>📍 {biz.address}</span>}
            {biz.website && <a href={biz.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#059669]"><ExternalLink className="h-3 w-3" />אתר</a>}
            {biz.expires_at && <span>פג: {new Date(biz.expires_at).toLocaleDateString("he-IL")}</span>}
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-3 pt-3 border-t border-[#F5F5F5] flex-wrap">
        {!biz.is_active && (
          <button onClick={() => onApprove(biz.id)} disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#059669] text-white font-semibold text-sm hover:bg-[#047857] transition-colors disabled:opacity-50">
            <CheckCircle className="h-3.5 w-3.5" />{isLoading ? "..." : "אשר"}
          </button>
        )}
        <button onClick={() => onEdit(biz)} disabled={isLoading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#D1FAE5] text-[#047857] font-semibold text-sm hover:bg-[#A7F3D0] transition-colors disabled:opacity-50">
          <Pencil className="h-3.5 w-3.5" />ערוך
        </button>
        <button onClick={() => onDelete(biz.id)} disabled={isLoading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-100 text-red-700 font-semibold text-sm hover:bg-red-200 transition-colors disabled:opacity-50">
          <XCircle className="h-3.5 w-3.5" />מחק
        </button>
      </div>
    </div>
  );
}
