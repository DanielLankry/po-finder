"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Receipt,
  RefreshCw,
  Calendar,
  AlertCircle,
  Plus,
} from "lucide-react";

interface BusinessLite {
  id: string;
  name: string;
  expires_at: string | null;
  is_active: boolean;
}

export default function BillingPage() {
  const [businesses, setBusinesses] = useState<BusinessLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-stone-900">
          חיוב ומנוי
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          סטטוס הרישום שלך וחידוש התקופה
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
        <div className="flex items-center gap-2 px-6 py-4 border-b border-stone-100 bg-[#FAFAF7]">
          <Calendar className="h-5 w-5 text-stone-500" />
          <h2 className="font-display font-bold text-base text-stone-900">
            סטטוס נוכחי
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
              <BusinessStatusRow key={b.id} business={b} />
            ))}
          </div>
        )}
      </section>

      {/* Renew action */}
      <section>
        <Link
          href="/pricing"
          className="flex items-center gap-3 bg-gradient-to-br from-[#059669] to-[#047857] text-white rounded-2xl p-5 hover:shadow-lg transition-all group"
        >
          <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <RefreshCw className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-base">חידוש / הארכה</p>
            <p className="text-white/80 text-xs mt-0.5">בחרו תקופה חדשה והשלימו תשלום מיידי</p>
          </div>
        </Link>
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
              <Link href="/contact" className="text-[#059669] hover:underline font-medium">
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

function BusinessStatusRow({ business }: { business: BusinessLite }) {
  const exp = business.expires_at ? new Date(business.expires_at) : null;
  const now = new Date();
  const daysLeft = exp
    ? Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  let status: { label: string; color: string };
  if (!exp) status = { label: "לא שולם", color: "bg-stone-100 text-stone-600" };
  else if (daysLeft! <= 0) status = { label: "פג תוקף", color: "bg-red-100 text-red-700" };
  else if (daysLeft! <= 7) status = { label: `${daysLeft} ימים נותרו`, color: "bg-amber-100 text-amber-700" };
  else status = { label: "פעיל", color: "bg-emerald-100 text-[#059669]" };

  return (
    <div className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-stone-900 truncate">{business.name}</p>
        {exp && (
          <p className="text-xs text-stone-500 mt-0.5">
            {daysLeft! > 0 ? "פעיל עד" : "פג ב-"}{" "}
            {exp.toLocaleDateString("he-IL", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
      </div>
      <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${status.color}`}>
        {status.label}
      </span>
    </div>
  );
}
