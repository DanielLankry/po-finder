"use client";

import { useEffect, useState } from "react";
import {
  Coffee, CakeSlice, Beef, UtensilsCrossed, Leaf, Wheat, Flower2, Gem, Shirt, Phone, MapPin,
} from "lucide-react";
import type { Spot } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  coffee:  <Coffee  className="h-7 w-7" />,
  food:    <UtensilsCrossed className="h-7 w-7" />,
  sweets:  <CakeSlice className="h-7 w-7" />,
  meat:    <Beef    className="h-7 w-7" />,
  vegan:   <Leaf    className="h-7 w-7" />,
  celiac:  <Wheat   className="h-7 w-7" />,
  flowers: <Flower2 className="h-7 w-7" />,
  jewelry: <Gem     className="h-7 w-7" />,
  vintage: <Shirt   className="h-7 w-7" />,
};

function useCountdown(expiresAt: string | null) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setText("פג תוקף"); return; }
      const days  = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins  = Math.floor((diff % 3600000)  / 60000);
      if (days > 0)  setText(`נגמר בעוד ${days} ימים ו-${hours} שעות`);
      else if (hours > 0) setText(`נגמר בעוד ${hours} שעות ו-${mins} דק'`);
      else setText(`נגמר בעוד ${mins} דקות`);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return text;
}

interface SpotCardProps {
  spot: Spot;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function SpotCard({ spot, isSelected, onClick }: SpotCardProps) {
  const countdown = useCountdown(spot.expires_at);
  const icon = CATEGORY_ICON[spot.category];

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onClick?.(); }}
      className={[
        "flex gap-3 px-5 py-4 border-b border-[#EBEBEB] cursor-pointer transition-all duration-200",
        "border-r-[4px] border-r-[#F97316]",
        isSelected
          ? "bg-orange-50 shadow-sm"
          : "hover:bg-orange-50/60",
      ].join(" ")}
    >
      {/* Icon / Photo */}
      <div className="flex-shrink-0">
        {spot.photo_url ? (
          <img
            src={spot.photo_url}
            alt={spot.name}
            className="w-[88px] h-[88px] rounded-xl object-cover"
          />
        ) : (
          <div
            className="w-[88px] h-[88px] rounded-xl flex items-center justify-center text-white"
            style={{ background: "linear-gradient(135deg, #FB923C, #EA580C)" }}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-1 justify-center" dir="rtl">
        {/* Top row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Spot badge */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#F97316] text-white">
            ✦ Spot
          </span>
          {/* Category chip */}
          <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-orange-100 text-orange-800">
            {CATEGORY_LABELS[spot.category] ?? spot.category}
          </span>
        </div>

        {/* Name */}
        <p className="font-bold text-[#111] text-[15px] truncate">{spot.name}</p>

        {/* Description */}
        {spot.description && (
          <p className="text-[#666] text-[13px] leading-snug line-clamp-2">{spot.description}</p>
        )}

        {/* Address */}
        <div className="flex items-center gap-1 text-[#888] text-[12px]">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{spot.address}</span>
        </div>

        {/* Phone */}
        {spot.phone && (
          <a
            href={`tel:${spot.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-[#F97316] text-[12px] font-medium hover:underline w-fit"
          >
            <Phone className="h-3.5 w-3.5" />
            {spot.phone}
          </a>
        )}

        {/* Countdown */}
        {countdown && (
          <p className="text-[11px] font-semibold text-orange-600 mt-0.5">{countdown}</p>
        )}
      </div>
    </div>
  );
}
