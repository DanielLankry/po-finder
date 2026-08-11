import Link from "next/link";
import { ArrowLeft, Coffee, MapPin, Store } from "lucide-react";
import SafeBusinessImage from "@/components/business/SafeBusinessImage";
import type { LaunchPromotionStatus } from "@/lib/launch-promotion";
import { FIRST_BUSINESSES_SIGNUP_PATH } from "@/lib/launch-promotion";

/** Demonstrates the real listing structure without pretending a business exists. */
export default function ExampleBusinessCard({
  promotion,
}: {
  promotion: LaunchPromotionStatus | null;
}) {
  const offerOpen = promotion?.isOpen && promotion.remaining > 0;

  return (
    <section className="mx-auto w-full max-w-xl text-right" data-testid="example-business-card">
      <div className="mb-4 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#17402D] bg-[#FFF3B0] shadow-[3px_3px_0_0_#17402D]">
          <Store className="h-7 w-7 text-[#17402D]" aria-hidden="true" />
        </div>
        <h2 className="font-display text-3xl leading-none text-[#17402D]">
          ככה העסק שלכם יכול להיראות
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-[#17402D]/65">
          זהו כרטיס הדגמה בלבד. ברגע שיעלה עסק אמיתי, הכרטיס לדוגמה ייעלם.
        </p>
      </div>

      <article className="brand-panel overflow-hidden bg-[#FFFDF7]">
        <div className="grid sm:grid-cols-[170px_minmax(0,1fr)]">
          <div className="relative min-h-36 border-b-2 border-[#17402D] bg-[#DDEBE0] sm:border-b-0 sm:border-l-2">
            <SafeBusinessImage
              alt="המחשה לכרטיס של עסק לדוגמה"
              category="coffee"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span className="absolute right-3 top-3 rounded-full border-2 border-[#17402D] bg-[#FFF3B0] px-3 py-1 text-xs font-black text-[#17402D] shadow-[2px_2px_0_0_#17402D]">
              עסק לדוגמה
            </span>
          </div>
          <div className="space-y-3 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-3xl leading-none text-[#17402D]">קפה השכונה</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#8A3618]">
                  <Coffee className="h-3.5 w-3.5" aria-hidden="true" /> קפה ושתייה
                </p>
              </div>
              <span className="rounded-full border-2 border-[#2D6A4F]/25 bg-[#EFF5F0] px-2.5 py-1 text-[11px] font-black text-[#2D6A4F]">
                תצוגה מקדימה
              </span>
            </div>
            <p className="text-sm leading-relaxed text-[#17402D]/70">
              כאן יופיע תיאור קצר שמספר לשכונה מה מיוחד בעסק, מה מוכרים ומתי כדאי להגיע.
            </p>
            <p className="flex items-center gap-2 text-xs font-bold text-[#17402D]/60">
              <MapPin className="h-4 w-4 text-[#C4552D]" aria-hidden="true" />
              כתובת או מיקום העסק יופיעו כאן
            </p>
          </div>
        </div>
      </article>

      {offerOpen ? (
        <div className="brand-panel-orange mt-4 p-4 text-center">
          <p className="font-display text-2xl text-[#17402D]">
            נשארו {promotion.remaining} מקומות ל־3 חודשים חינם
          </p>
          <p className="mt-1 text-xs text-[#17402D]/70">
            המקום נשמר ביצירת הפרופיל; התקופה מתחילה רק לאחר אישור מנהל.
          </p>
          <Link
            href={FIRST_BUSINESSES_SIGNUP_PATH}
            className="brand-button mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-6 text-sm font-black"
          >
            שמירת מקום חינם
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <Link
          href="/auth/register?redirectTo=%2Fdashboard%2Fprofile"
          className="brand-button mx-auto mt-4 flex min-h-11 w-fit items-center justify-center gap-2 rounded-xl px-6 text-sm font-black"
        >
          יצירת פרופיל עסק
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </section>
  );
}
