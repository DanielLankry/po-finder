"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, LogIn, Star } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface ReviewFormProps {
  businessId: string;
  onSuccess?: () => void;
}

export default function ReviewForm({ businessId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authState, setAuthState] = useState<"loading" | "signed-in" | "signed-out">("loading");

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setAuthState(data.user ? "signed-in" : "signed-out");
    }).catch(() => {
      if (!cancelled) setAuthState("signed-out");
    });
    return () => { cancelled = true; };
  }, []);

  if (authState === "loading") {
    return <div className="h-24 animate-pulse rounded-2xl bg-[#DDEBE0]/70" aria-label="טוען טופס ביקורת" />;
  }

  if (authState === "signed-out") {
    return (
      <div className="rounded-2xl border-2 border-[#17402D]/20 bg-[#F7F3EA] p-5 text-center" dir="rtl">
        <p className="text-sm font-bold text-[#17402D]">יש להתחבר כדי להשאיר ביקורת</p>
        <Link
          href="/auth/login"
          className="brand-button mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-black"
        >
          <LogIn className="h-4 w-4" aria-hidden="true" />
          כניסה
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div
        className="flex items-center justify-center gap-2 rounded-2xl border-2 border-[#17402D]/25 bg-[#DDEBE0] p-5 text-center"
        dir="rtl"
      >
        <CheckCircle2 className="h-5 w-5 text-[#17402D]" aria-hidden="true" />
        <p className="text-sm font-black text-[#17402D]">
          הביקורת נשמרה, תודה רבה.
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
    if (!privacyAccepted) {
      setError("יש לאשר את מדיניות הפרטיות לפני שליחת ביקורת");
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
          privacyAccepted,
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
    <div className="rounded-2xl border-2 border-[#17402D]/20 bg-[#F7F3EA] p-4 lg:p-5" dir="rtl">
      <h3 className="mb-4 font-display text-xl text-[#17402D]">כתבו ביקורת</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star picker */}
        <div>
          <p className="mb-2 text-sm font-bold text-[#17402D]/70">איך היה?</p>
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
                className="flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] transition-transform hover:scale-105 active:scale-95"
              >
                <Star
                  className={`h-7 w-7 transition-all duration-100 ${
                    star <= (hoverRating || rating)
                      ? "fill-amber-400 text-amber-400 scale-110"
                      : "fill-[#D8D1C2] text-[#D8D1C2]"
                  }`}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Name field */}
        <label className="grid gap-1.5 text-sm font-bold text-[#17402D]/70">
          שם <span className="font-normal text-[#17402D]/45">(אופציונלי)</span>
          <input
            type="text"
            placeholder="איך נציג אתכם?"
            value={reviewerName}
            onChange={(e) => setReviewerName(e.target.value)}
            maxLength={60}
            className="brand-control h-11 w-full rounded-xl px-3 text-sm font-normal text-[#17402D] transition-all placeholder:text-[#17402D]/35"
            dir="rtl"
          />
        </label>

        {/* Comment */}
        <label className="relative grid gap-1.5 text-sm font-bold text-[#17402D]/70">
          ספרו על החוויה <span className="font-normal text-[#17402D]/45">(אופציונלי)</span>
          <textarea
            placeholder="מה אהבתם במיוחד?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={300}
            className="brand-control w-full resize-none rounded-xl px-3 py-2.5 pb-7 text-sm font-normal text-[#17402D] transition-all placeholder:text-[#17402D]/35"
            dir="rtl"
          />
          <span className="absolute bottom-2 left-2 text-[11px] font-normal text-[#17402D]/40">
            {comment.length}/300
          </span>
        </label>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">
            {error}
          </p>
        )}

        <label className="flex items-start gap-2 text-xs leading-relaxed text-[#17402D]/65">
          <input
            type="checkbox"
            required
            checked={privacyAccepted}
            onChange={(e) => setPrivacyAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-[#17402D]/30 accent-[#2D6A4F]"
          />
          <span>
            אני מאשר/ת שהשם והביקורת עשויים להופיע באתר, בהתאם{" "}
            <Link href="/privacy" className="text-[#2D6A4F] hover:underline">
              למדיניות הפרטיות
            </Link>
            .
          </span>
        </label>

        <button
          type="submit"
          disabled={loading || !privacyAccepted}
          className="brand-button min-h-12 w-full rounded-full px-5 text-sm font-black transition-all focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#2D6A4F]/35 disabled:cursor-not-allowed disabled:opacity-55"
        >
          {loading ? "...שולחים" : "שלח ביקורת"}
        </button>
      </form>
    </div>
  );
}
