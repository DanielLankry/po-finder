"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORY_LABELS } from "@/lib/types";
import { CheckCircle, XCircle, Phone, ExternalLink, RefreshCw } from "lucide-react";

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
}

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
    if (res.ok) {
      setBusinesses((prev) =>
        prev.map((b) => b.id === businessId ? { ...b, is_active: true } : b)
      );
    } else {
      alert("שגיאה באישור העסק");
    }
    setActionLoading(null);
  }

  async function deleteBiz(businessId: string) {
    if (!confirm("בטוח למחוק את העסק?")) return;
    setActionLoading(businessId);
    const res = await fetch(`/api/admin/businesses/${businessId}`, { method: "DELETE" });
    if (res.ok) {
      setBusinesses((prev) => prev.filter((b) => b.id !== businessId));
    } else {
      alert("שגיאה במחיקה");
    }
    setActionLoading(null);
  }

  const pending = businesses.filter((b) => !b.is_active);
  const active = businesses.filter((b) => b.is_active);

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="h-10 w-10 rounded-full border-4 border-emerald-200 border-t-[#059669] animate-spin" />
    </div>
  );

  return (
    <div className="p-8" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-extrabold text-2xl text-[#111]">ניהול עסקים</h1>
          <p className="text-[#888] text-sm">{pending.length} ממתינים · {active.length} פעילים</p>
        </div>
        <button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#E5E7EB] text-sm text-[#555] hover:bg-[#F9F9F9] transition-colors">
          <RefreshCw className="h-4 w-4" /> רענן
        </button>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="font-bold text-lg text-[#D97706] mb-3">⏳ ממתינים לאישור ({pending.length})</h2>
          <div className="flex flex-col gap-4">
            {pending.map((biz) => (
              <BusinessCard key={biz.id} biz={biz} onApprove={approve} onDelete={deleteBiz} actionLoading={actionLoading} />
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
          <div className="flex flex-col gap-4">
            {active.map((biz) => (
              <BusinessCard key={biz.id} biz={biz} onApprove={approve} onDelete={deleteBiz} actionLoading={actionLoading} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BusinessCard({ biz, onApprove, onDelete, actionLoading }: {
  biz: Business;
  onApprove: (id: string) => void;
  onDelete: (id: string) => void;
  actionLoading: string | null;
}) {
  const isLoading = actionLoading === biz.id;

  return (
    <div className={`bg-white rounded-2xl border p-5 shadow-sm ${biz.is_active ? "border-[#E5E7EB]" : "border-amber-200 bg-amber-50/30"}`}>
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-[#059669] text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {CATEGORY_LABELS[biz.category as keyof typeof CATEGORY_LABELS] ?? biz.category}
            </span>
            {biz.kashrut !== "none" && (
              <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {biz.kashrut === "kosher" ? "כשר" : "כשר למהדרין"}
              </span>
            )}
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${biz.is_active ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
              {biz.is_active ? "פעיל" : "ממתין"}
            </span>
          </div>

          <h2 className="font-bold text-[#111] text-lg">{biz.name}</h2>
          {biz.description && <p className="text-[#666] text-sm mt-1 mb-2 line-clamp-2">{biz.description}</p>}

          <div className="flex flex-wrap gap-3 text-sm text-[#555] mt-2">
            {biz.phone && (
              <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{biz.phone}</span>
            )}
            {biz.business_number && <span className="text-[#888]">עוסק: {biz.business_number}</span>}
            {biz.website && (
              <a href={biz.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                <ExternalLink className="h-3.5 w-3.5" />אתר
              </a>
            )}
            {biz.instagram && <span className="text-pink-600">@{biz.instagram}</span>}
          </div>

          <div className="text-[#AAA] text-xs mt-2 space-y-0.5">
            <p>נוצר: {new Date(biz.created_at).toLocaleString("he-IL")}</p>
            {biz.expires_at && <p>פג תוקף: {new Date(biz.expires_at).toLocaleString("he-IL")}</p>}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-4 pt-4 border-t border-[#F5F5F5]">
        {!biz.is_active && (
          <button
            onClick={() => onApprove(biz.id)}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#059669] text-white font-semibold text-sm hover:bg-[#047857] transition-colors disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4" />
            {isLoading ? "מאשר..." : "אשר ופרסם"}
          </button>
        )}
        <button
          onClick={() => onDelete(biz.id)}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-100 text-red-700 font-semibold text-sm hover:bg-red-200 transition-colors disabled:opacity-50"
        >
          <XCircle className="h-4 w-4" />
          מחק
        </button>
      </div>
    </div>
  );
}
