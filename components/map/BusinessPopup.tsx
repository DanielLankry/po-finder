"use client";

import Link from "next/link";
import { MapPin, Clock, X, Star, CheckCircle2 } from "lucide-react";
import type { BusinessWithSchedule } from "@/lib/types";
import { CATEGORY_LABELS, KASHRUT_LABELS } from "@/lib/types";
import { isOpenNow } from "@/lib/utils/schedule";

interface BusinessPopupProps {
  business: BusinessWithSchedule;
  onClose: () => void;
  isMobile?: boolean;
}

export default function BusinessPopup({
  business,
  onClose,
  isMobile = false,
}: BusinessPopupProps) {
  const schedule = business.today_schedule ?? null;
  const open = isOpenNow(schedule);
  const primaryPhoto = business.photos?.find((p) => p.is_primary) ?? business.photos?.[0];
  const address = schedule?.address ?? business.address;

  const content = (
    <div
      className="rounded-2xl overflow-hidden bg-white"
      style={{ boxShadow: "0 12px 32px rgba(0,0,0,0.18), 0 0 1px rgba(0,0,0,0.04)" }}
      dir="rtl"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 left-2 z-10 h-8 w-8 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] shadow-sm"
        aria-label="סגירת חלונית"
      >
        <X className="h-4 w-4 text-slate-600" />
      </button>

      {/* Photo */}
      <div className="relative h-44 bg-slate-100">
        {primaryPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={primaryPhoto.url}
            alt={`תמונה של ${business.name}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#ECFDF5] via-[#D1FAE5] to-[#A7F3D0]">
            <div className="h-12 w-12 rounded-2xl bg-[#059669] flex items-center justify-center mb-2 shadow-md">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <span className="text-[#059669]/70 text-xs font-medium">{CATEGORY_LABELS[business.category]}</span>
          </div>
        )}
        {/* Status overlay badge on photo */}
        <div className="absolute bottom-2 right-2">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm ${
              open
                ? "bg-emerald-500/90 text-white"
                : schedule
                ? "bg-black/60 text-white"
                : "bg-black/50 text-white/80"
            }`}
          >
            {open ? "● פתוח עכשיו" : schedule ? "סגור היום" : 'אין לו"ז'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Rating row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
            <span className="font-semibold text-sm text-slate-900">
              {business.avg_rating > 0 ? business.avg_rating.toFixed(1) : "—"}
            </span>
            {business.review_count > 0 && (
              <span className="text-slate-400 text-xs">
                ({business.review_count} ביקורות)
              </span>
            )}
          </div>
        </div>

        {/* Name + category */}
        <div>
          <h3 className="font-display font-bold text-base text-slate-900 leading-tight">
            {business.name}
          </h3>
          <p className="text-slate-400 text-xs mt-0.5">
            {CATEGORY_LABELS[business.category]}
          </p>
        </div>

        <hr className="border-slate-100" />

        {/* Address & hours */}
        {address && (
          <div className="flex items-start gap-2 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5 text-[#059669] mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>{address}</span>
          </div>
        )}
        {schedule?.open_time && schedule?.close_time && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5 text-[#059669] flex-shrink-0" aria-hidden="true" />
            <span className="tabular-nums">
              {schedule.open_time.slice(0, 5)} – {schedule.close_time.slice(0, 5)}
            </span>
          </div>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          {business.kashrut !== "none" && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857] font-medium pop-in">
              {KASHRUT_LABELS[business.kashrut]}
            </span>
          )}
          {business.business_number && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium pop-in stagger-1">
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              עסק מאומת
            </span>
          )}
        </div>

        {/* CTA */}
        <Link
          href={`/businesses/${business.id}`}
          className="flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-medium text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-offset-2 shadow-sm btn-press"
        >
          לפרטים המלאים ←
        </Link>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/40 z-30 fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
        {/* Bottom sheet */}
        <div
          className="fixed inset-x-0 bottom-0 z-30 popup-enter"
          role="dialog"
          aria-modal="true"
          aria-label={`פרטי ${business.name}`}
        >
          <div className="mx-auto max-w-sm pb-4 px-4">
            <div className="h-1 w-10 bg-slate-300 rounded-full mx-auto mb-3" aria-hidden="true" />
            <div className="relative">{content}</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div
      className="absolute z-20 w-80 slide-in-right"
      role="dialog"
      aria-modal="true"
      aria-label={`פרטי ${business.name}`}
      style={{ top: "calc(100% + 8px)" }}
    >
      <div className="relative">{content}</div>
    </div>
  );
}
