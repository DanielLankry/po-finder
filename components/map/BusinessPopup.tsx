"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  MapPin,
  Navigation,
  Star,
  X,
} from "lucide-react";
import type { BusinessWithSchedule } from "@/lib/types";
import { CATEGORY_LABELS, KASHRUT_LABELS } from "@/lib/types";
import { getBusinessAvailability } from "@/lib/utils/schedule";
import { trackEvent } from "@/lib/analytics";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import SafeBusinessImage from "@/components/business/SafeBusinessImage";

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
  const availability = getBusinessAvailability(business);
  const primaryPhoto = business.photos?.find((photo) => photo.is_primary) ?? business.photos?.[0];
  const address = schedule?.address ?? business.address;
  const mapsQuery = encodeURIComponent(address ?? business.name);

  const content = (
    <article className="brand-panel overflow-hidden bg-[#FFFDF7]" dir="rtl">
      <div className="relative h-32 border-b-2 border-[#17402D] bg-[#DDEBE0]">
        <SafeBusinessImage
          src={primaryPhoto?.url}
          alt={`תמונה של ${business.name}`}
          category={business.category}
          className="h-full w-full object-cover"
          loading="eager"
        />

        <button
          type="button"
          onClick={onClose}
          className="business-type-button absolute left-3 top-3 z-10 flex h-11 min-h-11 w-11 items-center justify-center p-0"
          aria-label="סגירת חלונית"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <span className="brand-chip absolute bottom-3 right-3 px-3 py-1 text-xs">
          {CATEGORY_LABELS[business.category]}
        </span>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-2xl leading-none text-[#17402D]">
              {business.name}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold text-[#17402D]/70">
              {business.avg_rating > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-[#F4B942] text-[#8A3618]" aria-hidden="true" />
                  {business.avg_rating.toFixed(1)}
                  <span className="font-normal">({business.review_count})</span>
                </span>
              )}
              {business.kashrut !== "none" && <span>{KASHRUT_LABELS[business.kashrut]}</span>}
              {business.is_verified && (
                <span className="inline-flex items-center gap-1 text-[#5D3A9B]">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  מאומת
                </span>
              )}
            </div>
          </div>

          <span
            className={`shrink-0 rounded-full border-2 px-2.5 py-1 text-xs font-black ${
              availability === "open"
                ? "border-[#17402D] bg-[#DDEBE0] text-[#17402D]"
                : availability === "closed"
                  ? "border-[#8A3618]/40 bg-[#F7E7DE] text-[#8A3618]"
                  : "border-[#8A6517]/40 bg-[#FFF3B0] text-[#72540C]"
            }`}
          >
            {availability === "open"
              ? "פתוח עכשיו"
              : availability === "closed"
                ? "סגור עכשיו"
                : "שעות לא עודכנו"}
          </span>
        </div>

        <div className="brand-rule" aria-hidden="true" />

        <div className="grid gap-2 text-sm text-[#17402D]/80">
          {address && (
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#C4552D]" aria-hidden="true" />
              <span className="line-clamp-2">{address}</span>
            </div>
          )}
          {schedule?.open_time && schedule?.close_time && (
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 shrink-0 text-[#C4552D]" aria-hidden="true" />
              <span className="tabular-nums font-bold">
                היום, {schedule.open_time.slice(0, 5)}–{schedule.close_time.slice(0, 5)}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-3">
          <Link
            href={`/businesses/${business.id}`}
            className="brand-button flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-black transition-all focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#2D6A4F]/35"
          >
            לכרטיס העסק
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
          {address && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent(business.id, "directions_click")}
              className="business-type-button flex min-h-11 items-center justify-center gap-2 px-4 text-sm font-black"
              aria-label={`הוראות הגעה אל ${business.name}`}
            >
              <Navigation className="h-4 w-4" aria-hidden="true" />
              <span className="hidden min-[360px]:inline">ניווט</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );

  if (isMobile) {
    return (
      <Sheet open onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="z-[70] border-0 bg-transparent p-0 shadow-none"
          dir="rtl"
        >
          <SheetTitle className="sr-only">פרטי {business.name}</SheetTitle>
          <SheetDescription className="sr-only">
            פרטי העסק, שעות פעילות וקישורים לניווט ולכרטיס המלא
          </SheetDescription>
          <div className="mx-auto max-w-md px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#FFFDF7] shadow-sm" aria-hidden="true" />
            <div className="relative">{content}</div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className="relative w-[360px] max-w-[calc(100vw-3rem)] popup-focus-enter"
      role="dialog"
      aria-label={`פרטי ${business.name}`}
    >
      {content}
    </div>
  );
}
