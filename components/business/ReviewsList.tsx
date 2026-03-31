import { Star } from "lucide-react";
import type { Review } from "@/lib/types";

interface ReviewsListProps {
  reviews: Review[];
}

function formatHebrewDate(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  const colors = [
    "bg-blue-100 text-blue-700",
    "bg-emerald-100 text-emerald-700",
    "bg-violet-100 text-violet-700",
    "bg-sky-100 text-sky-700",
    "bg-rose-100 text-rose-700",
  ];
  const colorIndex = name.charCodeAt(0) % colors.length;

  return (
    <div
      className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${colors[colorIndex]}`}
      aria-hidden="true"
    >
      {initials || "?"}
    </div>
  );
}

export default function ReviewsList({ reviews }: ReviewsListProps) {
  if (reviews.length === 0) {
    return (
      <p className="text-slate-400 text-sm py-4 text-center">
        אין ביקורות עדיין. היו הראשונים!
      </p>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {reviews.map((review, i) => (
        <div
          key={review.id}
          className={`flex gap-4 fade-in-up stagger-${Math.min(i + 1, 6)}`}
        >
          <UserAvatar name={review.reviewer_name ?? review.user?.name ?? "משתמש"} />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm text-slate-900">
                {review.reviewer_name ?? review.user?.name ?? "משתמש אנונימי"}
              </span>
              <span className="text-slate-400 text-xs tabular-nums">
                {formatHebrewDate(review.created_at)}
              </span>
            </div>

            {/* Stars */}
            <div
              className="flex items-center gap-0.5 mb-2"
              aria-label={`דירוג ${review.rating} מתוך 5 כוכבים`}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3.5 w-3.5 ${
                    star <= review.rating
                      ? "fill-amber-400 text-amber-400"
                      : "fill-slate-200 text-slate-200"
                  }`}
                  aria-hidden="true"
                />
              ))}
            </div>

            {review.comment && (
              <p className="text-slate-600 text-sm leading-relaxed">
                {review.comment}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
