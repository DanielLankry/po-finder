"use client";

import { useEffect, useState, useCallback } from "react";
import { Sparkles, Banknote, Store, Plus, X } from "lucide-react";

interface BoostBusiness {
  id: string;
  name: string;
  boost_expires_at: string | null;
  is_active: boolean;
}

export default function AdminBoostsPage() {
  const [businesses, setBusinesses] = useState<BoostBusiness[]>([]);
  const [revenueAgorot, setRevenueAgorot] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchBoosts = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/boosts");
    if (res.ok) {
      const data = await res.json();
      setBusinesses(data.businesses ?? []);
      setRevenueAgorot(data.revenueAgorot ?? 0);
    }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchBoosts(); }, [fetchBoosts]);

  async function act(businessId: string, action: "grant" | "revoke") {
    if (action === "revoke" && !confirm("לבטל את הקידום לעסק הזה?")) return;
    setActionLoading(businessId);
    const res = await fetch("/api/admin/boosts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, action }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "שגיאה בעדכון קידום");
    }
    await fetchBoosts();
    setActionLoading(null);
  }

  const now = new Date();
  const isBoosted = (b: BoostBusiness) =>
    !!b.boost_expires_at && new Date(b.boost_expires_at) > now;
  const activeBoosts = businesses.filter(isBoosted).length;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("he-IL", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="p-4 md:p-8" dir="rtl">
      <div className="mb-6">
        <h1 className="font-extrabold text-2xl text-[#111]">קידומים</h1>
        <p className="text-[#888] text-sm">ניהול קידום חודשי — מי מקודם, עד מתי, והכנסות החודש</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-6 max-w-lg">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center mb-3">
            <Sparkles className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-3xl font-extrabold text-[#111]">{activeBoosts}</p>
          <p className="text-[#888] text-sm mt-1">קידומים פעילים</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-[#EFF5F0] flex items-center justify-center mb-3">
            <Banknote className="h-5 w-5 text-[#2D6A4F]" />
          </div>
          <p className="text-3xl font-extrabold text-[#111]">₪{Math.round(revenueAgorot / 100)}</p>
          <p className="text-[#888] text-sm mt-1">הכנסות קידום החודש</p>
        </div>
      </div>

      {/* Businesses list */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-[#E5E7EB] bg-[#F9FAFB]">
          <Store className="h-4 w-4 text-[#888]" />
          <span className="text-xs font-bold text-[#888]">כל העסקים</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-[#AAA] text-sm">טוען...</div>
        ) : businesses.length === 0 ? (
          <div className="p-8 text-center text-[#AAA] text-sm">אין עסקים עדיין</div>
        ) : (
          <div className="divide-y divide-[#F5F5F5]">
            {businesses.map((b) => {
              const boosted = isBoosted(b);
              const busy = actionLoading === b.id;
              return (
                <div
                  key={b.id}
                  className="px-4 md:px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#111] truncate">{b.name}</p>
                    <p className="text-xs text-[#888] mt-0.5">
                      {boosted && b.boost_expires_at
                        ? `מקודם עד ${formatDate(b.boost_expires_at)}`
                        : "לא מקודם"}
                      {!b.is_active && " • עסק לא פעיל"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full ${
                        boosted ? "bg-amber-100 text-amber-800" : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      <Sparkles className="h-3 w-3" />
                      {boosted ? "מקודם" : "רגיל"}
                    </span>
                    <button
                      onClick={() => act(b.id, "grant")}
                      disabled={busy}
                      className="inline-flex items-center gap-1 h-9 px-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 text-xs font-semibold hover:bg-amber-100 transition-colors disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {busy ? "..." : boosted ? "הארך 30 יום" : "הענק 30 יום"}
                    </button>
                    {boosted && (
                      <button
                        onClick={() => act(b.id, "revoke")}
                        disabled={busy}
                        className="inline-flex items-center gap-1 h-9 px-3 rounded-lg text-red-600 border border-red-200 bg-red-50 text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" />
                        בטל קידום
                      </button>
                    )}
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
