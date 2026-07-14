"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, MessageCircle, Zap } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import DurationSelectorCard from "@/components/business/DurationSelectorCard";
import { createClient } from "@/lib/supabase/client";
import {
  BUSINESS_INFO,
  VENDOR_FAQS,
  getWhatsAppHref,
} from "@/lib/site-config";
import type { Plan } from "@/lib/plans";

const whatsappHref = getWhatsAppHref();

export default function PricingClient({
  plans,
  nowIso,
}: {
  plans: Plan[];
  nowIso: string;
}) {
  const router = useRouter();
  const [routing, setRouting] = useState(false);
  const [showCancelBanner, setShowCancelBanner] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("payment") === "cancelled";
  });

  async function continueWithPlan(plan: Plan) {
    setRouting(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const destination = `/dashboard/billing?plan=${plan.code}`;
    router.push(
      user
        ? destination
        : `/auth/register?redirectTo=${encodeURIComponent(destination)}`
    );
  }

  return (
    <div className="brand-canvas min-h-screen" dir="rtl">
      <Navbar />
      {showCancelBanner ? (
        <div className="mt-[72px] border-b border-amber-300 bg-amber-50">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-amber-950">התשלום בוטל</p>
              <p className="mt-0.5 text-xs text-amber-800">
                לא חויבת. הטיוטה נשמרה ואפשר לנסות שוב מלוח הבקרה.
              </p>
            </div>
            <button
              onClick={() => setShowCancelBanner(false)}
              aria-label="סגירה"
              className="h-8 w-8 rounded-full text-xl text-amber-800 hover:bg-amber-100"
            >
              ×
            </button>
          </div>
        </div>
      ) : null}

      <main className={showCancelBanner ? "" : "pt-[72px]"}>
        <section className="px-4 pb-10 pt-14 md:pt-20">
          <div className="mx-auto max-w-5xl text-center">
            <div className="brand-chip mb-5 px-4 py-1.5 text-sm">
              <Zap className="h-4 w-4" />
              מוצר אחד, מחיר לפי זמן
            </div>
            <h1 className="font-display text-5xl leading-[0.95] text-[#17402D] md:text-7xl">
              בוחרים כמה זמן.
              <br />
              <span className="marker-highlight">משלמים פעם אחת.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-stone-600">
              יוצרים טיוטת עסק בחינם. אחרי אימות בוחרים בין חודש ל־12 חודשים,
              בלי מנוי, בלי חידוש אוטומטי ובלי חבילות קידום.
            </p>
          </div>
        </section>

        <section className="px-4 pb-14">
          <div className="mx-auto max-w-3xl">
            <DurationSelectorCard
              plans={plans}
              nowIso={nowIso}
              loading={routing}
              onAction={continueWithPlan}
            />
            <p className="mt-5 text-center text-sm text-stone-600">
              העסק עולה לאוויר רק אחרי אימות ותשלום מוצלח. כשהזמן מסתיים הוא
              יורד אוטומטית מהמפה, מהחיפוש ומעמוד העסק; לוח הבקרה נשאר זמין לחידוש.
            </p>
          </div>
        </section>

        <section className="px-4 pb-12">
          <div className="brand-panel-soft mx-auto flex max-w-5xl flex-col justify-between gap-4 p-6 md:flex-row md:items-center md:p-8">
            <div>
              <p className="font-display text-3xl text-[#17402D]">רוצים לדבר לפני שמתחילים?</p>
              <p className="mt-1 text-sm text-stone-600">
                אפשר ליצור טיוטה בחינם או לפנות אלינו לפני כל תשלום.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 font-semibold text-white hover:bg-[#1EB856]"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              ) : null}
              <a
                href={`mailto:${BUSINESS_INFO.contactEmail}`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-5 font-semibold text-stone-700 hover:bg-stone-50"
              >
                <Mail className="h-4 w-4" /> {BUSINESS_INFO.contactEmail}
              </a>
            </div>
          </div>
        </section>

        <section className="px-4 pb-20">
          <div className="brand-panel mx-auto max-w-5xl p-6 md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <h2 className="font-display text-4xl text-[#17402D]">שאלות נפוצות</h2>
              <div className="brand-rule flex-1" aria-hidden="true" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {VENDOR_FAQS.map((item) => (
                <div key={item.question} className="brand-panel-soft bg-[#FFFDF7] p-5">
                  <h3 className="font-bold text-stone-950">{item.question}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">{item.answer}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-xs text-stone-500">
              בתשלום מאשרים את <Link href="/terms" className="text-[#2D6A4F] underline">תנאי השימוש</Link>, את{" "}
              <Link href="/refund" className="text-[#2D6A4F] underline">מדיניות ההחזרים</Link> ואת{" "}
              <Link href="/privacy" className="text-[#2D6A4F] underline">מדיניות הפרטיות</Link>.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
