"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Receipt,
  RefreshCw,
  Calendar,
  AlertCircle,
  Plus,
  Sparkles,
} from "lucide-react";

interface BusinessLite {
  id: string;
  name: string;
  expires_at: string | null;
  boost_expires_at: string | null;
  is_active: boolean;
}

export default function BillingPage() {
  const [businesses, setBusinesses] = useState<BusinessLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // "kind:businessId" of the checkout currently being started, or null.
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/businesses?mine=1")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setBusinesses(data.businesses ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  async function startCheckout(kind: "listing" | "boost", businessId: string) {
    setCheckoutLoading(`${kind}:${businessId}`);
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, businessId }),
      });
      const raw = await res.text();
      let data: { ok?: boolean; url?: string; detail?: string } = {};
      try {
        data = JSON.parse(raw);
      } catch {
        data = {};
      }
      if (!res.ok || data.ok === false || !data.url) {
        alert(
          `שגיאה בהפניה לתשלום. נסו שוב או צרו איתנו קשר.${data.detail ? `\n\n(${data.detail})` : ""}`
        );
        setCheckoutLoading(null);
        return;
      }
      window.location.href = data.url;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(`שגיאה בהפניה לתשלום. נסו שוב או צרו איתנו קשר.\n\n(${msg})`);
      setCheckoutLoading(null);
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-stone-900">
          חיוב ומנוי
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          רישום שנתי (₪15 לשנה) וקידום חודשי (₪20 לחודש) — לכל עסק בנפרד
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Current listings / status */}
      <section className="bg-white rounded-2xl border border-stone-200 shadow-card overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-stone-100 bg-[#F7F3EA]">
          <Calendar className="h-5 w-5 text-stone-500" />
          <h2 className="font-display font-bold text-base text-stone-900">
            העסקים שלי
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-stone-400 text-sm">טוען...</div>
        ) : businesses.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-stone-500 text-sm mb-4">עדיין לא יצרת עסק</p>
            <Link
              href="/dashboard/profile"
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm"
            >
              <Plus className="h-4 w-4" />
              יצירת עסק חדש
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {businesses.map((b) => (
              <BusinessBillingRow
                key={b.id}
                business={b}
                checkoutLoading={checkoutLoading}
                onCheckout={startCheckout}
              />
            ))}
          </div>
        )}
      </section>

      {/* Products explainer */}
      <section className="grid sm:grid-cols-2 gap-4">
        <div className="flex items-start gap-3 bg-gradient-to-br from-[#2D6A4F] to-[#1F5038] text-white rounded-2xl p-5">
          <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <RefreshCw className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-base">רישום שנתי — ₪15 לשנה</p>
            <p className="text-white/80 text-xs mt-0.5">
              העסק מופיע על המפה לשנה שלמה. מתחדש בתשלום חד-פעמי.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="h-11 w-11 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="font-bold text-base text-amber-900">קידום חודשי — ₪20 לחודש</p>
            <p className="text-amber-800/80 text-xs mt-0.5">
              מופיעים ראשונים בחיפוש ובמפה עם תג ״מקודם״. נרכש חודש-חודש, ללא התחייבות.
            </p>
          </div>
        </div>
      </section>

      {/* Receipts info */}
      <section className="bg-white rounded-2xl border border-stone-200 shadow-card p-6">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
            <Receipt className="h-5 w-5 text-stone-500" />
          </div>
          <div className="flex-1">
            <h2 className="font-display font-bold text-base text-stone-900 mb-1">
              קבלות וחשבוניות
            </h2>
            <p className="text-stone-500 text-sm">
              קבלות נשלחות אליכם בדוא&quot;ל לאחר השלמת התשלום. לעותק נוסף או שאלות —{" "}
              <Link href="/contact" className="text-[#2D6A4F] hover:underline font-medium">
                צרו איתנו קשר
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function BusinessBillingRow({
  business,
  checkoutLoading,
  onCheckout,
}: {
  business: BusinessLite;
  checkoutLoading: string | null;
  onCheckout: (kind: "listing" | "boost", businessId: string) => void;
}) {
  const now = new Date();

  const exp = business.expires_at ? new Date(business.expires_at) : null;
  const daysLeft = exp
    ? Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  let listingStatus: { label: string; color: string };
  if (!exp) listingStatus = { label: "לא שולם", color: "bg-stone-100 text-stone-600" };
  else if (daysLeft! <= 0) listingStatus = { label: "פג תוקף", color: "bg-red-100 text-red-700" };
  else if (daysLeft! <= 14) listingStatus = { label: `${daysLeft} ימים נותרו`, color: "bg-amber-100 text-amber-700" };
  else listingStatus = { label: "פעיל", color: "bg-emerald-100 text-[#2D6A4F]" };

  const boostExp = business.boost_expires_at ? new Date(business.boost_expires_at) : null;
  const boosted = !!boostExp && boostExp > now;

  const formatDate = (d: Date) =>
    d.toLocaleDateString("he-IL", { day: "2-digit", month: "long", year: "numeric" });

  const anyLoading = checkoutLoading !== null;
  const listingLoading = checkoutLoading === `listing:${business.id}`;
  const boostLoading = checkoutLoading === `boost:${business.id}`;

  return (
    <div className="px-4 sm:px-6 py-4 space-y-3">
      {/* Name + status pills */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-stone-900 truncate">{business.name}</p>
          {exp && (
            <p className="text-xs text-stone-500 mt-0.5">
              {daysLeft! > 0 ? "רישום פעיל עד" : "הרישום פג ב-"} {formatDate(exp)}
            </p>
          )}
          {boosted && boostExp && (
            <p className="text-xs text-amber-700 mt-0.5">מקודם עד {formatDate(boostExp)}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${listingStatus.color}`}>
            {listingStatus.label}
          </span>
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full ${
              boosted ? "bg-amber-100 text-amber-800" : "bg-stone-100 text-stone-500"
            }`}
          >
            <Sparkles className="h-3 w-3" />
            {boosted ? "מקודם" : "לא מקודם"}
          </span>
        </div>
      </div>

      {/* Purchase buttons — full-width stacked on mobile */}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={() => onCheckout("listing", business.id)}
          disabled={anyLoading}
          className="flex-1 h-11 rounded-xl text-white font-semibold text-sm disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #2D6A4F 0%, #1F5038 100%)" }}
        >
          {listingLoading ? "מעבירים..." : "חידוש רישום • ₪15 לשנה"}
        </button>
        <button
          onClick={() => onCheckout("boost", business.id)}
          disabled={anyLoading}
          className="flex-1 h-11 rounded-xl font-semibold text-sm border-2 border-amber-400 text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors disabled:opacity-60"
        >
          {boostLoading
            ? "מעבירים..."
            : boosted
              ? "הארכת קידום • ₪20 לחודש"
              : "קידום העסק • ₪20 לחודש"}
        </button>
      </div>
    </div>
  );
}
