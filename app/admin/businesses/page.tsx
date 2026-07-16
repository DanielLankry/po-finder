"use client";

import { useEffect, useState, useCallback } from "react";
import { CATEGORY_LABELS, KASHRUT_LABELS } from "@/lib/types";
import type { BusinessCategory, KashrutStatus } from "@/lib/types";
import { CheckCircle, XCircle, Phone, ExternalLink, RefreshCw, Plus, X, Pencil, MapPin, PauseCircle, PlayCircle } from "lucide-react";

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
  is_verified: boolean;
  is_legacy_public?: boolean;
  created_at: string;
  expires_at: string | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
}

/** Mirrors the public listing predicate for the admin's live-listing count. */
function isCurrentlyPublic(business: Business): boolean {
  if (!business.is_active || !business.is_verified) return false;
  if (business.is_legacy_public) return true;
  if (!business.expires_at) return false;
  return new Date(business.expires_at).getTime() > Date.now();
}

const EMPTY_FORM = {
  owner_id: "",
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
    const res = await fetch("/api/admin/businesses");
    if (res.ok) {
      const data = await res.json();
      setBusinesses(data.businesses ?? []);
    }
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
    if (res.ok) fetchAll();
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

  /** Pause a public listing or reactivate it with a fresh 30-day window when expired. */
  async function toggleVisibility(business: Business) {
    const currentlyPublic = isCurrentlyPublic(business);
    const updates: { is_active: boolean; is_verified?: boolean; expires_at?: string } = {
      is_active: !currentlyPublic,
    };
    if (!currentlyPublic) {
      updates.is_verified = true;
      const hasFutureExpiry = !!business.expires_at && Date.parse(business.expires_at) > Date.now();
      if (!business.is_legacy_public && !hasFutureExpiry) {
        updates.expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }
    }

    const message = currentlyPublic
      ? `להסתיר את ${business.name} מהאתר?`
      : `להציג את ${business.name}${updates.expires_at ? " ל־30 יום" : ""}?`;
    if (!confirm(message)) return;

    setActionLoading(business.id);
    const response = await fetch(`/api/admin/businesses/${business.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const body = await response.json().catch(() => ({}));
    if (response.ok) {
      setBusinesses((current) => current.map((item) => item.id === business.id ? body.business as Business : item));
    } else alert(body.error ?? "שגיאה בעדכון מצב העסק");
    setActionLoading(null);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await fetch("/api/admin/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "שגיאה לא ידועה");
      setBusinesses((prev) => [data.business as Business, ...prev]);
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
      const res = await fetch(`/api/admin/businesses/${editBiz.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
          is_active: editBiz.is_active,
          is_verified: editBiz.is_verified,
          expires_at: editBiz.expires_at,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "שגיאה לא ידועה");
      setBusinesses((prev) => prev.map((b) => b.id === editBiz.id ? data.business as Business : b));
      setEditBiz(null);
    } catch (err) {
      alert("שגיאה: " + (err instanceof Error ? err.message : String(err)));
    }
    setEditLoading(false);
  }

  const pending = businesses.filter((b) => !b.is_verified);
  const verified = businesses.filter((b) => b.is_verified);
  const active = businesses.filter((b) => isCurrentlyPublic(b));

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="h-10 w-10 rounded-full border-4 border-emerald-200 border-t-[#2D6A4F] animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="font-extrabold text-2xl text-[#111]">ניהול עסקים</h1>
          <p className="text-[#888] text-sm">{pending.length} ממתינים לאימות · {verified.length} מאומתים · {active.length} מוצגים כעת</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAll} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-[#E5E7EB] text-sm text-[#555] hover:bg-[#F9F9F9] transition-colors">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">רענן</span>
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold text-sm transition-colors"
            style={{ background: "linear-gradient(135deg, #2D6A4F, #1F5038)" }}
          >
            <Plus className="h-4 w-4" />
            הוסף עסק ידני
          </button>
        </div>
      </div>

      {/* Add Business Modal */}
      {showAddForm && (
        <div className="brand-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowAddForm(false)}>
          <div className="brand-dialog-surface max-h-[90vh] w-full max-w-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="brand-dialog-header flex items-center justify-between p-5">
              <h2 className="font-display text-3xl leading-none text-[#17402D]">הוספת עסק ידני</h2>
              <button onClick={() => setShowAddForm(false)} className="brand-icon-button h-11 w-11">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-[#111] mb-1">מזהה בעל העסק (UUID) *</label>
                  <input required value={form.owner_id} onChange={(e) => setForm({...form, owner_id: e.target.value})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" dir="ltr" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-[#111] mb-1">שם העסק *</label>
                  <input required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]" placeholder="שם העסק" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1">קטגוריה</label>
                  <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value as BusinessCategory})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]">
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1">כשרות</label>
                  <select value={form.kashrut} onChange={(e) => setForm({...form, kashrut: e.target.value as KashrutStatus})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]">
                    {Object.entries(KASHRUT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1">טלפון</label>
                  <input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]" placeholder="050-0000000" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1">מספר עוסק</label>
                  <input value={form.business_number} onChange={(e) => setForm({...form, business_number: e.target.value})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]" placeholder="555555555" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-[#111] mb-1">כתובת</label>
                  <input value={form.address} onChange={(e) => setForm({...form, address: e.target.value})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]" placeholder="שוק הכרמל, תל אביב" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1">קו רוחב (lat)</label>
                  <input value={form.lat} onChange={(e) => setForm({...form, lat: e.target.value})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1">קו אורך (lng)</label>
                  <input value={form.lng} onChange={(e) => setForm({...form, lng: e.target.value})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]" dir="ltr" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-[#111] mb-1">תיאור</label>
                  <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={2}
                    className="w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] resize-none" placeholder="תיאור קצר..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1">אינסטגרם</label>
                  <input value={form.instagram} onChange={(e) => setForm({...form, instagram: e.target.value})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]" placeholder="username" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1">תוקף (חודשים)</label>
                  <select value={form.duration_months} onChange={(e) => setForm({...form, duration_months: e.target.value})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]">
                    <option value="1">חודש</option><option value="3">3 חודשים</option>
                    <option value="6">חצי שנה</option><option value="12">שנה</option>
                    <option value="120">ללא הגבלה (10 שנים)</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={addLoading || !form.name || !form.owner_id}
                className="brand-button h-12 w-full rounded-xl text-base font-black disabled:opacity-50">
                {addLoading ? "מוסיף..." : "הוסף עסק לאתר"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editBiz && (
        <div className="brand-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditBiz(null)}>
          <div className="brand-dialog-surface max-h-[90vh] w-full max-w-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="brand-dialog-header flex items-center justify-between p-5">
              <h2 className="font-display text-3xl leading-none text-[#17402D]">עריכת עסק — {editBiz.name}</h2>
              <button onClick={() => setEditBiz(null)} className="brand-icon-button h-11 w-11">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-[#111] mb-1">שם העסק *</label>
                  <input required value={editBiz.name} onChange={(e) => setEditBiz({...editBiz, name: e.target.value})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1">קטגוריה</label>
                  <select value={editBiz.category} onChange={(e) => setEditBiz({...editBiz, category: e.target.value})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]">
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1">כשרות</label>
                  <select value={editBiz.kashrut} onChange={(e) => setEditBiz({...editBiz, kashrut: e.target.value})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]">
                    {Object.entries(KASHRUT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1">טלפון</label>
                  <input value={editBiz.phone ?? ""} onChange={(e) => setEditBiz({...editBiz, phone: e.target.value})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1">WhatsApp</label>
                  <input value={editBiz.whatsapp ?? ""} onChange={(e) => setEditBiz({...editBiz, whatsapp: e.target.value})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-[#111] mb-1">כתובת</label>
                  <input value={editBiz.address ?? ""} onChange={(e) => setEditBiz({...editBiz, address: e.target.value})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1">קו רוחב (lat)</label>
                  <input value={editBiz.lat ?? ""} onChange={(e) => setEditBiz({...editBiz, lat: parseFloat(e.target.value) || null})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1">קו אורך (lng)</label>
                  <input value={editBiz.lng ?? ""} onChange={(e) => setEditBiz({...editBiz, lng: parseFloat(e.target.value) || null})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1">אתר</label>
                  <input value={editBiz.website ?? ""} onChange={(e) => setEditBiz({...editBiz, website: e.target.value})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1">אינסטגרם</label>
                  <input value={editBiz.instagram ?? ""} onChange={(e) => setEditBiz({...editBiz, instagram: e.target.value})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-1">מספר עוסק</label>
                  <input value={editBiz.business_number ?? ""} onChange={(e) => setEditBiz({...editBiz, business_number: e.target.value})}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-[#111] mb-1">תיאור</label>
                  <textarea value={editBiz.description ?? ""} onChange={(e) => setEditBiz({...editBiz, description: e.target.value})} rows={3}
                    className="w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] resize-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-[#111] mb-1">תאריך תפוגה</label>
                  <input
                    type="datetime-local"
                    value={toLocalDateTimeValue(editBiz.expires_at)}
                    onChange={(e) => setEditBiz({ ...editBiz, expires_at: fromLocalDateTimeValue(e.target.value) })}
                    className="w-full h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                    dir="ltr"
                  />
                </div>
                <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[#E5E7EB] px-4 text-sm font-semibold text-[#111]">
                  <input type="checkbox" checked={editBiz.is_verified} onChange={(e) => setEditBiz({ ...editBiz, is_verified: e.target.checked })} />
                  מאומת על ידי מנהל
                </label>
                <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[#E5E7EB] px-4 text-sm font-semibold text-[#111]">
                  <input type="checkbox" checked={editBiz.is_active} onChange={(e) => setEditBiz({ ...editBiz, is_active: e.target.checked })} />
                  מסומן כפעיל
                </label>
              </div>
              <button type="submit" disabled={editLoading}
                className="brand-button h-12 w-full rounded-xl text-base font-black disabled:opacity-50">
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
              <BusinessCard key={biz.id} biz={biz} onApprove={approve} onDelete={deleteBiz} onEdit={setEditBiz} onToggleVisibility={toggleVisibility} actionLoading={actionLoading} />
            ))}
          </div>
        </div>
      )}

      {/* Verified */}
      <div>
        <h2 className="font-bold text-lg text-[#2D6A4F] mb-3">✅ עסקים מאומתים ({verified.length})</h2>
        {verified.length === 0 ? (
          <p className="text-[#AAA] py-8 text-center">אין עסקים מאומתים</p>
        ) : (
          <div className="flex flex-col gap-3">
            {verified.map((biz) => (
              <BusinessCard key={biz.id} biz={biz} onApprove={approve} onDelete={deleteBiz} onEdit={setEditBiz} onToggleVisibility={toggleVisibility} actionLoading={actionLoading} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BusinessCard({ biz, onApprove, onDelete, onEdit, onToggleVisibility, actionLoading }: {
  biz: Business; onApprove: (id: string) => void;
  onDelete: (id: string) => void; onEdit: (b: Business) => void;
  onToggleVisibility: (b: Business) => void; actionLoading: string | null;
}) {
  const isLoading = actionLoading === biz.id;
  const currentlyPublic = isCurrentlyPublic(biz);
  return (
    <div className={`brand-panel-soft p-4 md:p-5 ${currentlyPublic ? "bg-[#FFFDF7]" : "bg-amber-50/70"}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="bg-[#2D6A4F] text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {CATEGORY_LABELS[biz.category as keyof typeof CATEGORY_LABELS] ?? biz.category}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${biz.is_verified ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
              {biz.is_verified ? (currentlyPublic ? "מאומת ומוצג" : "מאומת, לא מוצג") : "ממתין לאימות"}
            </span>
          </div>
          <h2 className="font-bold text-[#111] text-base md:text-lg truncate">{biz.name}</h2>
          {biz.description && <p className="text-[#666] text-sm mt-0.5 line-clamp-1">{biz.description}</p>}
          <div className="flex flex-wrap gap-2 text-xs text-[#888] mt-1.5">
            {biz.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{biz.phone}</span>}
            {biz.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" aria-hidden="true" />{biz.address}</span>}
            {biz.website && <a href={biz.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#2D6A4F]"><ExternalLink className="h-3 w-3" />אתר</a>}
            {biz.expires_at && <span>פג: {new Date(biz.expires_at).toLocaleDateString("he-IL")}</span>}
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-3 pt-3 border-t border-[#F5F5F5] flex-wrap">
        {!biz.is_verified && (
          <button onClick={() => onApprove(biz.id)} disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#2D6A4F] text-white font-semibold text-sm hover:bg-[#1F5038] transition-colors disabled:opacity-50">
            <CheckCircle className="h-3.5 w-3.5" />{isLoading ? "..." : "אשר"}
          </button>
        )}
        <button onClick={() => onEdit(biz)} disabled={isLoading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#DDEBE0] text-[#1F5038] font-semibold text-sm hover:bg-[#C3DCC9] transition-colors disabled:opacity-50">
          <Pencil className="h-3.5 w-3.5" />ערוך
        </button>
        {biz.is_verified && (
          <button onClick={() => onToggleVisibility(biz)} disabled={isLoading}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-sm transition-colors disabled:opacity-50 ${currentlyPublic ? "bg-amber-100 text-amber-800 hover:bg-amber-200" : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"}`}>
            {currentlyPublic ? <PauseCircle className="h-3.5 w-3.5" /> : <PlayCircle className="h-3.5 w-3.5" />}
            {currentlyPublic ? "הסתר" : "הפעל"}
          </button>
        )}
        <button onClick={() => onDelete(biz.id)} disabled={isLoading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-100 text-red-700 font-semibold text-sm hover:bg-red-200 transition-colors disabled:opacity-50">
          <XCircle className="h-3.5 w-3.5" />מחק
        </button>
      </div>
    </div>
  );
}

/** Convert an ISO expiry to the local value expected by datetime-local inputs. */
function toLocalDateTimeValue(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

/** Convert a datetime-local field back into an exact ISO timestamp for Supabase. */
function fromLocalDateTimeValue(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}
