"use client";

import {
  MapPin,
  Clock,
  Phone,
  ExternalLink,
  Navigation,
  CheckCircle2,
} from "lucide-react";
import type { Business, BusinessSchedule } from "@/lib/types";
import { isOpenNow } from "@/lib/utils/schedule";
import { trackEvent } from "@/lib/analytics";
import ShareButtons from "./ShareButtons";

interface StatusCardProps {
  business: Business;
  schedule: BusinessSchedule | null;
}

export default function StatusCard({ business, schedule }: StatusCardProps) {
  const open = isOpenNow(schedule);
  const address = schedule?.address ?? business.address;
  const waNumber = business.whatsapp?.replace(/\D/g, "") ?? "";
  const mapsQuery = encodeURIComponent(address ?? business.name);

  return (
    <div
      className="border border-slate-200 rounded-2xl p-6 sticky top-[100px] bg-white"
      style={{ boxShadow: "0 2px 8px rgba(37,99,235,0.08), 0 0 1px rgba(0,0,0,0.04)" }}
      dir="rtl"
    >
      {/* Status badge */}
      <div className="flex items-center gap-3 mb-5">
        <span
          className={`text-lg font-display font-bold ${
            open ? "text-emerald-600" : "text-slate-600"
          }`}
        >
          {open ? "פתוח עכשיו" : schedule ? "סגור היום" : "אין לוח זמנים להיום"}
        </span>
        {open && (
          <span className="relative flex h-3 w-3 flex-shrink-0" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
        )}
      </div>

      {/* Address */}
      {address && (
        <div className="flex items-start gap-2 text-slate-600 text-sm mb-2">
          <MapPin className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>{address}</span>
        </div>
      )}

      {/* Hours */}
      {schedule?.open_time && schedule?.close_time && (
        <div className="flex items-center gap-2 text-slate-600 text-sm mb-5">
          <Clock className="h-4 w-4 text-blue-400 flex-shrink-0" aria-hidden="true" />
          <span className="tabular-nums">
            {schedule.open_time.slice(0, 5)} – {schedule.close_time.slice(0, 5)}
          </span>
        </div>
      )}

      {/* Today's note */}
      {schedule?.note && (
        <p className="text-slate-600 text-sm bg-blue-50 border border-blue-100 rounded-xl p-3 mb-5">
          {schedule.note}
        </p>
      )}

      {/* Verified badge */}
      {business.business_number && (
        <div className="flex items-center gap-1.5 mb-5">
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            עסק מאומת
          </span>
        </div>
      )}

      <div className="space-y-3">
        {/* WhatsApp — primary green (brand color, always green) */}
        {waNumber && (
          <a
            href={`https://wa.me/${waNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent(business.id, "whatsapp_click")}
            className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-[#25D366] hover:bg-[#1EB856] text-white font-medium text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 shadow-sm btn-press"
          >
            <WhatsAppIcon />
            שלחו הודעה בוואטסאפ
          </a>
        )}

        {/* Phone — outlined */}
        {business.phone && (
          <a
            href={`tel:${business.phone}`}
            onClick={() => trackEvent(business.id, "call_click")}
            className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 font-medium text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 btn-press"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            התקשרו
          </a>
        )}

        {/* Google Maps */}
        {address && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent(business.id, "directions_click")}
            className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 font-medium text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 btn-press"
          >
            <Navigation className="h-4 w-4" aria-hidden="true" />
            קבלת הוראות הגעה
          </a>
        )}

        {/* Instagram */}
        {business.instagram && (
          <a
            href={`https://instagram.com/${business.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full h-10 text-slate-400 hover:text-blue-600 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-xl"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            @{business.instagram}
          </a>
        )}

        {/* Share */}
        <div className="pt-1">
          <ShareButtons businessId={business.id} businessName={business.name} />
        </div>
      </div>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}
