"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface ReviewFormProps {
  businessId: string;
  onSuccess?: () => void;
}

export default function ReviewForm({ businessId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (success) {
    return (
      <div
        className="border border-emerald-200 rounded-2xl p-5 bg-[#ECFDF5] text-center"
        dir="rtl"
      >
        <p className="text-[#065F46] font-semibold text-sm">
          ✅ הביקורת נשמרה! תודה רבה.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("יש לבחור דירוג בכוכבים");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: businessId,
          rating,
          comment: comment.trim() || null,
          reviewer_name: reviewerName.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "שגיאה בשמירת הביקורת");
      }

      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בשמירת הביקורת. נסו שוב.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-[#E5E7EB] rounded-2xl p-5 bg-white" dir="rtl">
      <h3 className="font-bold text-base text-[#111111] mb-4">כתבו ביקורת</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star picker */}
        <div>
          <p className="text-sm text-[#888888] mb-2">דירוג:</p>
          <div
            className="flex gap-1"
            role="group"
            aria-label="בחרו דירוג בין 1 ל-5 כוכבים"
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`${star} כוכבים`}
                aria-pressed={rating === star}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] rounded transition-transform hover:scale-110 active:scale-95"
              >
                <Star
                  className={`h-7 w-7 transition-all duration-100 ${
                    star <= (hoverRating || rating)
                      ? "fill-amber-400 text-amber-400 scale-110"
                      : "fill-slate-200 text-slate-200"
                  }`}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Name field */}
        <input
          type="text"
          placeholder="שם (אופציונלי)"
          value={reviewerName}
          onChange={(e) => setReviewerName(e.target.value)}
          maxLength={60}
          className="w-full h-10 px-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent transition-all"
          dir="rtl"
        />

        {/* Comment */}
        <div className="relative">
          <textarea
            placeholder="ספרו על החוויה שלכם (אופציונלי)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={300}
            className="w-full px-3 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent transition-all"
            dir="rtl"
          />
          <span className="absolute left-2 bottom-2 text-[11px] text-[#AAAAAA]">
            {comment.length}/300
          </span>
        </div>

        {error && (
          <p role="alert" className="text-red-600 text-sm">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-[#059669] hover:bg-[#047857] disabled:opacity-60 text-white font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-offset-2 shadow-sm active:scale-95"
        >
          {loading ? "...שולחים" : "שלח ביקורת"}
        </button>
      </form>
    </div>
  );
}
