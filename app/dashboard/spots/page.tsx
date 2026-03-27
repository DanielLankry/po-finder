"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SPOT_PLANS, CATEGORY_LABELS, type BusinessCategory, type Spot, type SpotDuration } from "@/lib/types";
import {
  Zap, MapPin, Clock, CheckCircle, XCircle, AlertCircle,
  Coffee, CakeSlice, Beef, UtensilsCrossed, Leaf, Wheat, Flower2, Gem, Shirt,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  coffee:  <Coffee className="h-4 w-4" />,
  food:    <UtensilsCrossed className="h-4 w-4" />,
  sweets:  <CakeSlice className="h-4 w-4" />,
  meat:    <Beef className="h-4 w-4" />,
  vegan:   <Leaf className="h-4 w-4" />,
  celiac:  <Wheat className="h-4 w-4" />,
  flowers: <Flower2 className="h-4 w-4" />,
  jewelry: <Gem className="h-4 w-4" />,
  vintage: <Shirt className="h-4 w-4" />,
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:  { label: "ממתין לאישור", color: "text-amber-600 bg-amber-50 border-amber-200",  icon: <AlertCircle className="h-3.5 w-3.5" /> },
  approved: { label: "פעיל",         color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: <CheckCircle className="h-3.5 w-3.5" /> },
  rejected: { label: "נדחה",         color: "text-red-600 bg-red-50 border-red-200",        icon: <XCircle className="h-3.5 w-3.5" /> },
  expired:  { label: "פג תוקף",      color: "text-stone-500 bg-stone-50 border-stone-200",  icon: <Clock className="h-3.5 w-3.5" /> },
};

function timeLeft(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "פג תוקף";
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `נגמר בעוד ${hours} שעות`;
  const days = Math.floor(hours / 24);
  return `נגמר בעוד ${days} ימים`;
}

export default function SpotsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<BusinessCategory>("food");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [duration, setDuration] = useState<SpotDuration>(7);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);

  const paymentStatus = searchParams.get("payment");

  useEffect(() => {
    fetchSpots();
  }, []);

  async function fetchSpots() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }

    const { data } = await supabase
      .from("spots")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    setSpots((data ?? []) as Spot[]);
    setLoading(false);
  }

  async function geocodeAddress() {
    if (!address.trim()) return;
    setGeoLoading(true);
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address + ", ישראל")}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&language=he`
      );
      const data = await res.json();
      if (data.results?.[0]) {
        const loc = data.results[0].geometry.location;
        setLat(String(loc.lat));
        setLng(String(loc.lng));
      }
    } finally {
      setGeoLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lat || !lng) { alert("נא לאמת את הכתובת קודם"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/spots/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, description, category, address,
          lat: parseFloat(lat), lng: parseFloat(lng),
          phone, photo_url: photoUrl, duration_days: duration,
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error ?? "שגיאה");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedPlan = SPOT_PLANS.find((p) => p.days === duration)!;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
              <Zap className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-[#111]">הSpots שלי</h1>
          </div>
          <p className="text-sm text-[#888]">דוכנים וחד-פעמיים — בולטים על המפה</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 h-10 px-5 rounded-full text-white text-sm font-semibold shadow-md transition-all hover:scale-105 active:scale-95"
          style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", boxShadow: "0 4px 12px rgba(245,158,11,0.35)" }}
        >
          <Zap className="h-4 w-4" />
          Spot חדש
        </button>
      </div>

      {/* Payment status banner */}
      {paymentStatus === "success" && (
        <div className="mb-5 flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">התשלום התקבל!</p>
            <p className="text-sm">הSpot שלך ממתין לאישור — בד"כ תוך מספר שעות.</p>
          </div>
        </div>
      )}
      {paymentStatus === "cancelled" && (
        <div className="mb-5 flex items-center gap-3 p-4 rounded-2xl bg-stone-50 border border-stone-200 text-stone-600">
          <XCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">התשלום בוטל. תוכל לנסות שוב בכל עת.</p>
        </div>
      )}

      {/* Creation form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 bg-white rounded-3xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          {/* Form header */}
          <div className="px-6 py-4 border-b border-[#F3F4F6]" style={{ background: "linear-gradient(135deg, #fffbeb, #fef3c7)" }}>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              <h2 className="font-bold text-[#111]">פרטי הSpot</h2>
            </div>
            <p className="text-xs text-[#888] mt-0.5">לאחר התשלום, הSpot יועבר לאישור ויופיע על המפה תוך מספר שעות</p>
          </div>

          <div className="px-6 py-5 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-[#333] mb-1.5">שם הדוכן *</label>
              <input
                value={name} onChange={(e) => setName(e.target.value)} required
                placeholder="למשל: קפה שירה, תכשיטי יעל..."
                className="w-full h-11 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-[#333] mb-1.5">קטגוריה *</label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(CATEGORY_LABELS) as BusinessCategory[]).map((cat) => (
                  <button
                    key={cat} type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium border transition-all ${
                      category === cat
                        ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                        : "bg-white text-[#555] border-[#E5E7EB] hover:border-amber-300"
                    }`}
                  >
                    {CATEGORY_ICONS[cat]}
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>

            {/* Address + geocode */}
            <div>
              <label className="block text-sm font-semibold text-[#333] mb-1.5">כתובת *</label>
              <div className="flex gap-2">
                <input
                  value={address} onChange={(e) => { setAddress(e.target.value); setLat(""); setLng(""); }} required
                  placeholder="רחוב, עיר"
                  className="flex-1 h-11 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                />
                <button
                  type="button" onClick={geocodeAddress}
                  disabled={!address.trim() || geoLoading}
                  className="h-11 px-4 rounded-xl text-sm font-medium border transition-all disabled:opacity-40 hover:bg-[#F3F4F6]"
                  style={{ borderColor: lat ? "#059669" : "#E5E7EB", color: lat ? "#059669" : "#555" }}
                >
                  {geoLoading ? "..." : lat ? "✓ אומת" : "אמת"}
                </button>
              </div>
              {lat && <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> {lat}, {lng}</p>}
            </div>

            {/* Phone + Description */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-[#333] mb-1.5">טלפון</label>
                <input
                  value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="050-0000000"
                  className="w-full h-11 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#333] mb-1.5">תמונה (URL)</label>
                <input
                  value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full h-11 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#333] mb-1.5">תיאור קצר</label>
              <textarea
                value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="מה מוכרים? מה מיוחד?"
                rows={2}
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
            </div>

            {/* Duration picker */}
            <div>
              <label className="block text-sm font-semibold text-[#333] mb-2">משך הופעה *</label>
              <div className="grid grid-cols-5 gap-2">
                {SPOT_PLANS.map((plan) => (
                  <button
                    key={plan.days} type="button"
                    onClick={() => setDuration(plan.days as SpotDuration)}
                    className={`relative flex flex-col items-center p-3 rounded-2xl border transition-all ${
                      duration === plan.days
                        ? "border-amber-400 shadow-md"
                        : "border-[#E5E7EB] hover:border-amber-200"
                    }`}
                    style={duration === plan.days ? { background: "linear-gradient(135deg, #fffbeb, #fef3c7)" } : { background: "#fff" }}
                  >
                    {plan.days === 7 && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">
                        מומלץ
                      </span>
                    )}
                    <span className="text-xs font-bold text-[#111] mt-1">{plan.label}</span>
                    <span className="text-xs text-[#888]">{plan.sublabel}</span>
                    <span className="text-sm font-extrabold mt-1" style={{ color: duration === plan.days ? "#d97706" : "#111" }}>
                      ₪{plan.price / 100}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="px-6 py-4 bg-[#FAFAFA] border-t border-[#F3F4F6] flex items-center justify-between gap-4">
            <div className="text-sm text-[#888]">
              תשלום חד-פעמי • אישור תוך מספר שעות
            </div>
            <button
              type="submit" disabled={submitting || !name || !address || !lat}
              className="flex items-center gap-2 h-11 px-6 rounded-full text-white font-semibold text-sm shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
              style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", boxShadow: "0 4px 14px rgba(245,158,11,0.4)" }}
            >
              <Zap className="h-4 w-4" />
              {submitting ? "מעביר לתשלום..." : `לתשלום — ₪${selectedPlan.price / 100}`}
            </button>
          </div>
        </form>
      )}

      {/* Spots list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 rounded-full border-4 border-amber-100 border-t-amber-500 animate-spin" />
        </div>
      ) : spots.length === 0 ? (
        <div className="text-center py-16">
          <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)" }}>
            <Zap className="h-8 w-8 text-amber-500" />
          </div>
          <p className="font-semibold text-[#222] mb-1">אין לך Spots עדיין</p>
          <p className="text-sm text-[#888]">צור spot ראשון — בולט על המפה, מיידי, חד-פעמי</p>
        </div>
      ) : (
        <div className="space-y-3">
          {spots.map((spot) => {
            const st = STATUS_CONFIG[spot.status];
            const isActive = spot.status === "approved" && new Date(spot.expires_at) > new Date();
            return (
              <div
                key={spot.id}
                className={`bg-white rounded-2xl border p-4 transition-all ${isActive ? "border-amber-200 shadow-sm" : "border-[#E5E7EB]"}`}
              >
                {isActive && (
                  <div className="absolute top-0 right-0 w-1 h-full rounded-r-2xl bg-amber-400" />
                )}
                <div className="flex items-start gap-3 relative">
                  {/* Photo or category icon */}
                  <div className={`h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0 text-xl overflow-hidden ${isActive ? "ring-2 ring-amber-300" : ""}`}
                    style={{ background: isActive ? "linear-gradient(135deg, #fef3c7, #fde68a)" : "#F3F4F6" }}>
                    {spot.photo_url ? (
                      <img src={spot.photo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-2xl">{
                        { coffee:"☕", food:"🍽️", sweets:"🍰", meat:"🥩", vegan:"🌿", celiac:"🌾", flowers:"🌸", jewelry:"💎", vintage:"👗" }[spot.category] ?? "📍"
                      }</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-bold text-[#111] truncate">{spot.name}</p>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${st.color}`}>
                        {st.icon}{st.label}
                      </span>
                    </div>
                    <p className="text-xs text-[#888] flex items-center gap-1">
                      <MapPin className="h-3 w-3" />{spot.address}
                    </p>
                    {isActive && (
                      <p className="text-xs font-medium text-amber-600 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />{timeLeft(spot.expires_at)}
                      </p>
                    )}
                    {spot.status === "pending" && (
                      <p className="text-xs text-amber-600 mt-1">ממתין לאישור — בד&quot;כ תוך מספר שעות</p>
                    )}
                    {spot.status === "rejected" && spot.admin_note && (
                      <p className="text-xs text-red-500 mt-1">סיבה: {spot.admin_note}</p>
                    )}
                  </div>

                  <div className="text-left flex-shrink-0">
                    <p className="text-xs text-[#888]">{spot.duration_days} ימים</p>
                    <p className="text-sm font-bold text-[#111]">₪{(spot.amount_paid / 100).toFixed(0)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
