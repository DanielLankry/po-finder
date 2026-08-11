"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, CalendarDays, Store } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LaunchPromotionStatus } from "@/lib/launch-promotion";
import { FIRST_BUSINESSES_SIGNUP_PATH } from "@/lib/launch-promotion";
import { trackMetaEvent } from "@/lib/meta-pixel";
import { trackPostHogEvent } from "@/lib/posthog";

const SESSION_KEY = "po-first-businesses-offer-seen";

/** Shows the bounded launch offer once per browser session while places remain. */
export default function FirstBusinessesOfferModal({
  promotion,
}: {
  promotion: LaunchPromotionStatus | null;
}) {
  const [open, setOpen] = useState(false);
  const tracked = useRef(false);

  useEffect(() => {
    if (!promotion?.isOpen || promotion.remaining <= 0) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const timer = window.setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, "1");
      setOpen(true);
    }, 800);

    return () => window.clearTimeout(timer);
  }, [promotion]);

  useEffect(() => {
    if (!open || !promotion || tracked.current) return;
    tracked.current = true;
    trackMetaEvent("ViewContent", {
      content_name: promotion.code,
      content_category: "launch_promotion",
    });
    trackPostHogEvent("launch_promotion_viewed", {
      campaign_code: promotion.code,
      remaining: promotion.remaining,
    });
  }, [open, promotion]);

  if (!promotion?.isOpen) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-0 sm:max-w-[560px]"
        dir="rtl"
        aria-describedby="first-businesses-offer-description"
        data-testid="first-businesses-offer-modal"
      >
        <div className="border-b-2 border-[#17402D] bg-[#FFF3B0] px-6 pb-5 pt-6 sm:px-8">
          <div className="mb-4 inline-flex rotate-[-1deg] items-center gap-2 rounded-full border-2 border-[#17402D] bg-[#FFFDF7] px-3 py-1.5 text-xs font-black text-[#17402D] shadow-[2px_2px_0_0_#17402D]">
            <Store className="h-4 w-4" aria-hidden="true" />
            מבצע ההשקה של פה קרוב
          </div>
          <DialogHeader className="items-start pe-12 text-right sm:text-right">
            <DialogTitle className="text-4xl sm:text-5xl">
              3 חודשים חינם
              <span className="mt-1 block text-[#C4552D]">ל־20 העסקים הראשונים</span>
            </DialogTitle>
            <DialogDescription
              id="first-businesses-offer-description"
              className="max-w-md text-sm font-medium leading-relaxed text-[#17402D]/75"
            >
              שומרים מקום ברגע שיוצרים את פרופיל העסק. הפרסום מתחיל רק אחרי
              אישור מנהל — ולכן זמן ההמתנה לא יורד משלושת החודשים.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-6 pb-6 pt-5 sm:px-8 sm:pb-8">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="brand-panel-soft flex items-center gap-3 bg-[#EFF5F0] p-4">
              <BadgeCheck className="h-6 w-6 shrink-0 text-[#2D6A4F]" aria-hidden="true" />
              <div>
                <p className="text-xs font-bold text-[#17402D]/60">מקומות שנותרו</p>
                <p className="font-display text-3xl text-[#17402D]" data-testid="promotion-remaining">
                  {promotion.remaining} מתוך {promotion.capacity}
                </p>
              </div>
            </div>
            <div className="brand-panel-soft flex items-center gap-3 bg-[#F7E7DE] p-4">
              <CalendarDays className="h-6 w-6 shrink-0 text-[#8A3618]" aria-hidden="true" />
              <div>
                <p className="text-xs font-bold text-[#17402D]/60">עד מתי אפשר להצטרף?</p>
                <p className="text-base font-black text-[#17402D]">31.12.2026</p>
              </div>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-[#17402D]/65">
            בכפוף למקומות פנויים, אימות העסק ואישור מנהל. אין חיוב אוטומטי;
            בסיום התקופה אפשר לבחור אם להאריך בתשלום חד־פעמי.
          </p>

          <Link
            href={FIRST_BUSINESSES_SIGNUP_PATH}
            onClick={() => {
              trackPostHogEvent("launch_promotion_cta_clicked", {
                campaign_code: promotion.code,
                placement: "modal",
                remaining: promotion.remaining,
              });
            }}
            className="brand-button flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-base font-black"
          >
            שמירת מקום חינם
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
