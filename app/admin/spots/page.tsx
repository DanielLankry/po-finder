"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, XCircle, Clock, MapPin, Zap } from "lucide-react";
import type { Spot } from "@/lib/types";

export default function AdminSpotsPage() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    fetchPending();
  }, []);

  async function fetchPending() {
    const supabase = createClient();
    const { data } = await supabase
      .from("spots")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    setSpots((data ?? []) as Spot[]);
    setLoading(false);
  }

  async function handleAction(spotId: string, action: "approve" | "reject") {
    setActionId(spotId);
    const res = await fetch("/api/spots/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spot_id: spotId, action, admin_note: note || undefined }),
    });
    if (res.ok) {
      setSpots((prev) => prev.filter((s) => s.id !== spotId));
      setNote("");
    }
    setActionId(null);
  }

  const CATEGORY_EMOJI: Record<string, string> = {
    coffee:"☕", food:"🍽️", sweets:"🍰", meat:"🥩", vegan:"🌿",
    celiac:"🌾", flowers:"🌸", jewelry:"💎", vintage:"👗",
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#111]">אישור Spots</h1>
          <p className="text-sm text-[#888]">{spots.length} ממתינים לאישור</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 rounded-full border-4 border-amber-100 border-t-amber-500 animate-spin" />
        </div>
      ) : spots.length === 0 ? (
        <div className="text-center py-16 text-[#888]">
          <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald-400" />
          <p className="font-semibold">אין Spots הממתינים לאישור</p>
        </div>
      ) : (
        <div className="space-y-4">
          {spots.map((spot) => (
            <div key={spot.id} className="bg-white rounded-2xl border border-amber-200 p-5 shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#fef3c7,#fde68a)" }}>
                  {spot.photo_url
                    ? <img src={spot.photo_url} alt="" className="h-full w-full object-cover rounded-xl" />
                    : CATEGORY_EMOJI[spot.category] ?? "📍"}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[#111]">{spot.name}</p>
                  {spot.description && <p className="text-sm text-[#666] mt-0.5">{spot.description}</p>}
                  <p className="text-xs text-[#888] mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" />{spot.address}</p>
                  {spot.phone && <p className="text-xs text-[#888]">📞 {spot.phone}</p>}
                </div>
                <div className="text-left flex-shrink-0">
                  <p className="text-sm font-bold text-amber-600">₪{(spot.amount_paid/100).toFixed(0)}</p>
                  <p className="text-xs text-[#888] flex items-center gap-1"><Clock className="h-3 w-3" />{spot.duration_days} ימים</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#F3F4F6]">
                <input
                  value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder="הערה (אופציונלי לדחייה)"
                  className="flex-1 h-9 rounded-xl border border-[#E5E7EB] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                <button
                  onClick={() => handleAction(spot.id, "approve")}
                  disabled={actionId === spot.id}
                  className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 transition-all"
                >
                  <CheckCircle className="h-4 w-4" />
                  אשר
                </button>
                <button
                  onClick={() => handleAction(spot.id, "reject")}
                  disabled={actionId === spot.id}
                  className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50 transition-all"
                >
                  <XCircle className="h-4 w-4" />
                  דחה
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
