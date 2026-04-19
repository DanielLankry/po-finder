import { Star } from "lucide-react";

interface ReviewSummaryProps {
  avgRating: number;
  reviewCount: number;
}

export default function ReviewSummary({ avgRating, reviewCount }: ReviewSummaryProps) {
  const rounded = Math.round(avgRating * 10) / 10;
  const bars = [5, 4, 3, 2, 1];

  return (
    <div className="flex items-center gap-8 py-4" dir="rtl">
      {/* Large average */}
      <div className="text-center flex-shrink-0">
        <p className="font-display font-extrabold text-5xl text-slate-900">
          {reviewCount > 0 ? rounded.toFixed(1) : "—"}
        </p>
        <div className="flex items-center justify-center gap-0.5 mt-1" aria-label={`דירוג ${rounded} מתוך 5`}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${
                star <= Math.round(avgRating)
                  ? "fill-amber-400 text-amber-400"
                  : "fill-slate-200 text-slate-200"
              }`}
              aria-hidden="true"
            />
          ))}
        </div>
        <p className="text-slate-400 text-xs mt-1">{reviewCount} ביקורות</p>
      </div>

      {/* Star bars */}
      <div className="flex-1 space-y-1.5">
        {bars.map((star, i) => (
          <div key={star} className={`flex items-center gap-2 text-xs text-slate-500 fade-in-up stagger-${i + 1}`}>
            <span className="w-4 text-left">{star}</span>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#ECFDF5]0 rounded-full transition-all duration-700"
                style={{ width: reviewCount > 0 ? `${(star / 5) * 80}%` : "0%" }}
                aria-hidden="true"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
