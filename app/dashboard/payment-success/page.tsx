"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Calendar, Receipt, ArrowLeft, Share2, Download } from "lucide-react";

interface SessionDetails {
  id: string;
  amount_total: number | null;
  currency: string;
  payment_status: string;
  created: number;
  customer_email: string | null;
  months: number;
  product_name: string | null;
}

export default function PaymentSuccessPage() {
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Read session_id from URL — avoids useSearchParams (Suspense requirement)
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");

    if (!sessionId) {
      setError("לא נמצא מזהה עסקה");
      setLoading(false);
      return;
    }

    fetch(`/api/stripe/session?id=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setSession(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" dir="rtl">
        <div className="h-10 w-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center" dir="rtl">
        <h1 className="font-display font-bold text-xl text-stone-900 mb-2">
          לא הצלחנו לאמת את התשלום
        </h1>
        <p className="text-stone-500 text-sm mb-6">{error ?? "נסו שוב או צרו קשר"}</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm"
        >
          חזרה לדשבורד
        </Link>
      </div>
    );
  }

  const amountShekels = session.amount_total ? session.amount_total / 100 : 0;
  const paidAt = new Date(session.created * 1000);
  const expiresAt = new Date(paidAt);
  expiresAt.setDate(expiresAt.getDate() + session.months * 30);

  const planLabel =
    session.months === 1
      ? "חודש"
      : session.months === 12
      ? "שנה"
      : `${session.months} חודשים`;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Hero — success */}
      <div className="bg-gradient-to-br from-emerald-50 to-[#ECFDF5] rounded-3xl border border-emerald-200 p-8 text-center shadow-card">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-emerald-100 mb-4 scale-in">
          <CheckCircle2 className="h-12 w-12 text-[#059669]" aria-hidden="true" />
        </div>
        <h1 className="font-display font-extrabold text-3xl text-stone-900 mb-2">
          תשלום התקבל! 🎉
        </h1>
        <p className="text-stone-600 max-w-md mx-auto">
          תודה! העסק שלך יהיה פעיל על המפה תוך מספר דקות לאחר אישור מנהל.
        </p>
      </div>

      {/* Receipt card */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-card overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-stone-100 bg-[#FAFAF7]">
          <Receipt className="h-5 w-5 text-stone-500" aria-hidden="true" />
          <h2 className="font-display font-bold text-base text-stone-900">פרטי הקבלה</h2>
        </div>

        <div className="divide-y divide-stone-100">
          <Row label="מזהה עסקה">
            <span className="font-mono text-xs text-stone-600 break-all">{session.id}</span>
          </Row>
          <Row label="תאריך תשלום">
            {paidAt.toLocaleDateString("he-IL", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </Row>
          <Row label="מוצר">
            {session.product_name ?? `פוקרוב — ${planLabel}`}
          </Row>
          <Row label="תקופת פרסום">{planLabel}</Row>
          <Row label="פעיל עד">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-[#059669]" aria-hidden="true" />
              {expiresAt.toLocaleDateString("he-IL", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
          </Row>
          <Row label="דוא&quot;ל לחשבונית">
            <span className="font-mono text-xs text-stone-600" dir="ltr">
              {session.customer_email ?? "—"}
            </span>
          </Row>
          <Row label="סכום ששולם">
            <span className="font-display font-bold text-lg text-stone-900 tabular-nums">
              ₪{amountShekels.toFixed(2)}
            </span>
          </Row>
        </div>

        <div className="px-6 py-4 bg-[#FAFAF7] border-t border-stone-100 text-xs text-stone-400">
          קבלה מפורטת נשלחה לדוא&quot;ל שלך. ניתן לצפות בכל ההיסטוריה תחת{" "}
          <Link href="/dashboard/billing" className="text-[#059669] hover:underline">
            חיוב ומנוי
          </Link>
          .
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/dashboard"
          className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          חזרה לדשבורד
        </Link>
        <Link
          href="/dashboard/billing"
          className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-sm transition-all"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          ניהול חיוב
        </Link>
        <Link
          href="/dashboard/profile"
          className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-sm transition-all"
        >
          <Share2 className="h-4 w-4" aria-hidden="true" />
          עריכת פרופיל העסק
        </Link>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 py-3">
      <span className="text-sm text-stone-500 flex-shrink-0">{label}</span>
      <span className="text-sm text-stone-900 text-left">{children}</span>
    </div>
  );
}
