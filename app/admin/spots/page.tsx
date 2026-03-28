"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Spot } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { CheckCircle, XCircle, Clock } from "lucide-react";

function AdminSpotsPageInner() {
  const params = useSearchParams();
  const secret = params.get("secret") ?? "";
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSpots = useCallback(async () => {
    if (!secret) { setError("Missing secret"); setLoading(false); return; }
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("spots")
      .select("*")
      .eq("is_approved", false)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (err) { setError(err.message); setLoading(false); return; }
    setSpots(data ?? []);
    setLoading(false);
  }, [secret]);

  useEffect(() => { fetchSpots(); }, [fetchSpots]);

  async function approve(spotId: string) {
    const res = await fetch("/api/admin/spots/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spotId, secret }),
    });
    const { ok, error: err } = await res.json();
    if (ok) setSpots((prev) => prev.filter((s) => s.id !== spotId));
    else alert("Error: " + err);
  }

  async function reject(spotId: string) {
    const supabase = createClient();
    await supabase.from("spots").update({ is_active: false }).eq("id", spotId);
    setSpots((prev) => prev.filter((s) => s.id !== spotId));
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="h-10 w-10 rounded-full border-4 border-orange-200 border-t-[#F97316] animate-spin" /></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-[#FAFAF7] p-8" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-extrabold text-[#111] mb-2">אישור Spots</h1>
        <p className="text-[#888] text-sm mb-6">{spots.length} ממתינים לאישור</p>

        {spots.length === 0 && (
          <div className="text-center py-16 text-[#AAA]">אין Spots ממתינים לאישור 🎉</div>
        )}

        <div className="flex flex-col gap-4">
          {spots.map((spot) => (
            <div key={spot.id} className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-[#F97316] text-white text-xs font-bold px-2 py-0.5 rounded-full">Spot</span>
                    <span className="text-[#888] text-xs">{CATEGORY_LABELS[spot.category as keyof typeof CATEGORY_LABELS] ?? spot.category}</span>
                  </div>
                  <h2 className="font-bold text-[#111] text-lg">{spot.name}</h2>
                  {spot.description && <p className="text-[#666] text-sm mt-1">{spot.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-[#555]">
                    <span>📍 {spot.address}</span>
                    {spot.phone && <span>📞 {spot.phone}</span>}
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{spot.duration_days} ימים • ₪{spot.amount_paid / 100}</span>
                  </div>
                  <p className="text-[#AAA] text-xs mt-2">owner: {spot.owner_id}</p>
                  <p className="text-[#AAA] text-xs">נוצר: {new Date(spot.created_at).toLocaleString("he-IL")}</p>
                </div>
                {spot.photo_url && (
                  <img src={spot.photo_url} alt={spot.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                )}
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => approve(spot.id)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#059669] text-white font-semibold text-sm hover:bg-[#047857] transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />
                  אשר ופרסם
                </button>
                <button
                  onClick={() => reject(spot.id)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-100 text-red-700 font-semibold text-sm hover:bg-red-200 transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                  דחה
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminSpotsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 rounded-full border-4 border-[#D1FAE5] border-t-[#059669] animate-spin" /></div>}>
      <AdminSpotsPageInner />
    </Suspense>
  );
}
