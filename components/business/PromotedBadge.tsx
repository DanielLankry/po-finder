import { Sparkles } from "lucide-react";

/** Small pill marking a business with an active visibility boost. */
export default function PromotedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[11px] font-bold text-amber-800 whitespace-nowrap">
      <Sparkles className="h-3 w-3" aria-hidden="true" />
      מקודם
    </span>
  );
}
