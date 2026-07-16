"use client";

import { useState } from "react";
import {
  Beef,
  CakeSlice,
  Coffee,
  Flower2,
  Gem,
  Leaf,
  MapPin,
  Shirt,
  UtensilsCrossed,
  Wheat,
} from "lucide-react";
import type { BusinessCategory } from "@/lib/types";
import { CATEGORY_THEME } from "@/lib/category-theme";

const CATEGORY_ICONS = {
  coffee: Coffee,
  food: UtensilsCrossed,
  sweets: CakeSlice,
  meat: Beef,
  vegan: Leaf,
  celiac: Wheat,
  flowers: Flower2,
  jewelry: Gem,
  vintage: Shirt,
} satisfies Record<BusinessCategory, typeof MapPin>;

interface SafeBusinessImageProps {
  src?: string | null;
  alt: string;
  category?: BusinessCategory;
  className?: string;
  loading?: "eager" | "lazy";
  onClick?: () => void;
}

/** Replaces missing or failed remote photos with the matching brand category. */
export default function SafeBusinessImage({
  src,
  alt,
  category,
  className = "",
  loading = "lazy",
  onClick,
}: SafeBusinessImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (src && failedSrc !== src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        onClick={onClick}
        onError={() => setFailedSrc(src)}
      />
    );
  }

  const theme = category ? CATEGORY_THEME[category] : null;
  const CategoryIcon = category ? CATEGORY_ICONS[category] : MapPin;

  return (
    <div
      className={`brand-map-grid flex items-center justify-center ${className}`}
      style={{
        backgroundColor: theme?.background ?? "#EDE8DC",
        color: theme?.ink ?? "#17402D",
      }}
      role="img"
      aria-label={alt}
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-current bg-white/65 shadow-[4px_4px_0_0_currentColor]">
        <CategoryIcon className="h-8 w-8" aria-hidden="true" />
      </span>
    </div>
  );
}
