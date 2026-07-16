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
    "bg-[#DDEBE0] text-[#1F5038]",
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
      <p className="py-4 text-center text-sm text-[#17402D]/50">
        אין ביקורות עדיין. היו הראשונים!
      </p>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {reviews.map((review, i) => (
        <article
          key={review.id}
          className={`flex gap-4 rounded-2xl border-2 border-[#17402D]/10 bg-white/70 p-4 fade-in-up stagger-${Math.min(i + 1, 6)}`}
        >
          <UserAvatar name={review.reviewer_name ?? review.user?.name ?? "משתמש"} />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-black text-[#17402D]">
                {review.reviewer_name ?? review.user?.name ?? "משתמש אנונימי"}
              </span>
              <span className="text-xs tabular-nums text-[#17402D]/45">
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
              <p className="text-sm leading-relaxed text-[#17402D]/75">
                {review.comment}
              </p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
