"use client";

import {
  CheckCircle2,
  Clock3,
  ExternalLink,
  Globe2,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
} from "lucide-react";
import type { Business, BusinessSchedule } from "@/lib/types";
import { isOpenNow } from "@/lib/utils/schedule";
import { trackEvent } from "@/lib/analytics";
import ShareButtons from "./ShareButtons";

interface StatusCardProps {
  business: Pick<
    Business,
    "id" | "name" | "address" | "phone" | "whatsapp" | "website" | "instagram" | "is_verified"
  >;
  schedule: BusinessSchedule | null;
}

export default function StatusCard({ business, schedule }: StatusCardProps) {
  const open = isOpenNow(schedule);
  const address = schedule?.address ?? business.address;
  const waNumber = business.whatsapp?.replace(/\D/g, "") ?? "";
  const mapsQuery = encodeURIComponent(address ?? business.name);
  const websiteUrl = business.website
    ? business.website.startsWith("http")
      ? business.website
      : `https://${business.website}`
    : null;

  return (
    <section className="brand-panel-soft overflow-hidden bg-[#FFFDF7]" dir="rtl">
      <div className="brand-map-grid border-b-2 border-[#17402D]/25 px-4 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`h-3 w-3 shrink-0 rounded-full border-2 border-[#FFFDF7] shadow-[0_0_0_2px_#17402D] ${
                open ? "bg-[#2D6A4F]" : "bg-[#C4552D]"
              }`}
              aria-hidden="true"
            />
            <h3 className="font-display text-xl text-[#17402D]">
              {open ? "פתוח עכשיו" : schedule ? "סגור היום" : "שעות פעילות לא עודכנו"}
            </h3>
          </div>
          {business.is_verified && (
            <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#5D3A9B]/30 bg-[#F0EAFE] px-2.5 py-1 text-xs font-black text-[#5D3A9B]">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              עסק מאומת
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4 p-4 lg:p-5">
        <div className="rounded-2xl border-2 border-[#17402D]/20 bg-[#F7F3EA] p-3.5 text-sm text-[#17402D]/80">
          {address && (
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#C4552D]" aria-hidden="true" />
              <span>{address}</span>
            </div>
          )}
          {schedule?.open_time && schedule?.close_time && (
            <div className={`flex items-center gap-2.5 ${address ? "mt-2" : ""}`}>
              <Clock3 className="h-4 w-4 shrink-0 text-[#C4552D]" aria-hidden="true" />
              <span className="tabular-nums font-bold">
                היום, {schedule.open_time.slice(0, 5)}–{schedule.close_time.slice(0, 5)}
              </span>
            </div>
          )}
          {schedule?.note && (
            <p className="mt-3 border-t-2 border-dashed border-[#17402D]/20 pt-3 text-sm leading-relaxed">
              {schedule.note}
            </p>
          )}
        </div>

        <div className="grid gap-3">
          {waNumber && (
            <a
              href={`https://wa.me/${waNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent(business.id, "whatsapp_click")}
              className="flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-[#17402D] bg-[#2D6A4F] px-5 text-sm font-black text-white shadow-[3px_3px_0_0_#17402D] transition-all hover:-translate-y-0.5 hover:bg-[#1F5038] hover:shadow-[5px_5px_0_0_#17402D] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#17402D]"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              שלחו הודעה בוואטסאפ
            </a>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {business.phone && (
              <a
                href={`tel:${business.phone}`}
                onClick={() => trackEvent(business.id, "call_click")}
                className="business-type-button flex min-h-11 items-center justify-center gap-2 px-4 text-sm font-black"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                התקשרו
              </a>
            )}
            {address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent(business.id, "directions_click")}
                className="business-type-button flex min-h-11 items-center justify-center gap-2 px-4 text-sm font-black"
              >
                <Navigation className="h-4 w-4" aria-hidden="true" />
                הוראות הגעה
              </a>
            )}
          </div>
        </div>

        {(websiteUrl || business.instagram) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t-2 border-dashed border-[#17402D]/20 pt-3 text-sm font-bold text-[#17402D]/70">
            {websiteUrl && (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-[#C4552D]"
              >
                <Globe2 className="h-4 w-4" aria-hidden="true" />
                אתר העסק
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            )}
            {business.instagram && (
              <a
                href={`https://instagram.com/${business.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-[#C4552D]"
              >
                @{business.instagram}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            )}
          </div>
        )}

        <div className="border-t-2 border-[#17402D]/10 pt-1">
          <ShareButtons businessId={business.id} businessName={business.name} />
        </div>
      </div>
    </section>
  );
}
