"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import Link from "next/link";
import { createReview } from "@/lib/db/reviews";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface AddReviewFormProps {
  businessId: string;
  isLoggedIn: boolean;
}

export default function AddReviewForm({ businessId, isLoggedIn }: AddReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoggedIn) {
    return (
      <div className="border border-slate-200 rounded-2xl p-5 text-center" dir="rtl">
        <p className="text-slate-500 text-sm mb-3">
          יש להתחבר כדי להשאיר ביקורת
        </p>
        <a
          href="/auth/login"
          className="inline-flex items-center justify-center h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 shadow-sm btn-press"
        >
          כניסה
        </a>
      </div>
    );
  }

  if (success) {
    return (
      <div className="border border-emerald-200 rounded-2xl p-5 bg-emerald-50 text-center scale-in" dir="rtl">
        <p className="text-emerald-700 font-medium">הביקורת שלכם נשמרה! תודה רבה.</p>
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

    const formData = new FormData();
    formData.set("business_id", businessId);
    formData.set("rating", String(rating));
    formData.set("comment", comment);

    try {
      await createReview(formData);
      setSuccess(true);
    } catch {
      setError("שגיאה בשמירת הביקורת. נסו שוב.");
    }
    setLoading(false);
  }

  return (
    <div className="border border-slate-200 rounded-2xl p-5" dir="rtl">
      <h3 className="font-display font-bold text-base text-slate-900 mb-4">
        כתבו ביקורת
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star picker */}
        <div>
          <p className="text-sm text-slate-500 mb-2">דירוג:</p>
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
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded transition-transform hover:scale-110 active:scale-95"
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

        {/* Comment */}
        <Textarea
          placeholder="ספרו על החוויה שלכם (אופציונלי)..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="resize-none rounded-xl border-slate-200 focus-visible:ring-blue-600"
          aria-label="תגובה"
          maxLength={500}
        />

        {error && (
          <p role="alert" className="text-red-600 text-sm">
            {error}
          </p>
        )}

        <p className="text-xs text-stone-400 text-center">
          בשליחה אני מאשר/ת את{" "}
          <Link href="/privacy" className="text-[#059669] hover:underline">
            מדיניות הפרטיות
          </Link>
        </p>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm btn-press"
        >
          {loading ? "...שולחים" : "שלחו ביקורת"}
        </Button>
      </form>
    </div>
  );
}
