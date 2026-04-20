"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  Receipt,
  RefreshCw,
  Calendar,
  AlertCircle,
  ExternalLink,
  Plus,
} from "lucide-react";

interface PastSession {
  id: string;
  amount_total: number | null;
  currency: string;
  created: number;
  months: number;
  payment_intent: string | null;
}

interface BusinessLite {
  id: string;
  name: string;
  expires_at: string | null;
  is_active: boolean;
}

export default function BillingPage() {
  const [sessions, setSessions] = useState<PastSession[]>([]);
  const [businesses, setBusinesses] = useState<BusinessLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/stripe/invoices").then((r) => r.json()),
      fetch("/api/businesses?mine=1").then((r) => r.json()).catch(() => ({ businesses: [] })),
    ])
      .then(([invoiceData, bizData]) => {
        if (invoiceData.error) setError(invoiceData.error);
        else setSessions(invoiceData.sessions ?? []);
        setBusinesses(bizData.businesses ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function openStripePortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError(data.error ?? "לא ניתן לפתוח את פורטל החיוב");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-stone-900">
          חיוב ומנוי
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          ניהול הרישום שלך, היסטוריית תשלומים וחשבוניות
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

      {/* Actions */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/pricing"
          className="flex items-center gap-3 bg-gradient-to-br from-[#059669] to-[#047857] text-white rounded-2xl p-5 hover:shadow-lg transition-all group"
        >
          <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <RefreshCw className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-base">חידוש / הארכה</p>
            <p className="text-white/80 text-xs mt-0.5">בחרו תקופה חדשה ושלמו</p>
          </div>
        </Link>

        <button
          onClick={openStripePortal}
          disabled={portalLoading}
          className="flex items-center gap-3 bg-white border border-stone-200 rounded-2xl p-5 hover:border-blue-400 hover:shadow-card transition-all group text-right disabled:opacity-60"
        >
          <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
            <CreditCard className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-base text-stone-900 flex items-center gap-1.5">
              ניהול אמצעי תשלום
              <ExternalLink className="h-3 w-3 opacity-50" />
            </p>
            <p className="text-stone-500 text-xs mt-0.5">
              {portalLoading ? "טוען..." : "Stripe · כרטיסים, חשבוניות PDF"}
            </p>
          </div>
        </button>
      </section>

      {/* Payment history */}
      <section className="bg-white rounded-2xl border border-stone-200 shadow-card overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-stone-100 bg-[#FAFAF7]">
          <Receipt className="h-5 w-5 text-stone-500" />
          <h2 className="font-display font-bold text-base text-stone-900">
            היסטוריית תשלומים
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-stone-400 text-sm">טוען...</div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center text-stone-400 text-sm">
            עדיין לא בוצעו תשלומים
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-stone-500 text-xs">
                <tr>
                  <th className="text-right py-3 px-4 font-medium">תאריך</th>
                  <th className="text-right py-3 px-4 font-medium">תקופה</th>
                  <th className="text-right py-3 px-4 font-medium">סכום</th>
                  <th className="text-right py-3 px-4 font-medium">פרטים</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {sessions.map((s) => {
                  const date = new Date(s.created * 1000);
                  const amount = s.amount_total ? s.amount_total / 100 : 0;
                  const planLabel =
                    s.months === 1
                      ? "חודש"
                      : s.months === 12
                      ? "שנה"
                      : `${s.months} חודשים`;

                  return (
                    <tr key={s.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-3 px-4 text-stone-700 tabular-nums">
                        {date.toLocaleDateString("he-IL", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 text-stone-600">{planLabel}</td>
                      <td className="py-3 px-4 font-semibold text-stone-900 tabular-nums">
                        ₪{amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/dashboard/payment-success?session_id=${s.id}`}
                          className="text-[#059669] hover:underline text-xs font-medium"
                        >
                          צפייה בקבלה ←
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
