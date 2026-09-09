"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MailCheck, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { safeRedirectPath } from "@/lib/safe-redirect";

type Props = {
  email: string;
  callbackUrl: string;
  next?: string;
  onChangeEmail?: () => void;
  justSent?: boolean;
};

/** Resending uses the same callback as signup, preserving the owner's destination. */
export function EmailVerificationPanel({ email, callbackUrl, next, onChangeEmail, justSent = false }: Props) {
  const [remaining, setRemaining] = useState(justSent ? 60 : 0);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (remaining === 0) return;
    const timer = window.setTimeout(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [remaining]);

  async function resend() {
    if (sending || remaining > 0) return;
    setSending(true);
    setError("");
    setNotice("");
    try {
      const { error: resendError } = await createClient().auth.resend({
        type: "signup",
        email: email.trim(),
        options: { emailRedirectTo: callbackUrl },
      });
      if (resendError) {
        setError(resendError.status === 429
          ? "נשלחו כמה בקשות ברצף. המתינו דקה ונסו שוב."
          : "לא הצלחנו לשלוח את מייל האימות. בדקו את הכתובת ונסו שוב.");
        if (resendError.status === 429) setRemaining(60);
        return;
      }
      setRemaining(60);
      setNotice("בקשת השליחה התקבלה. אם החשבון ממתין לאימות, יישלח אליו קישור חדש.");
    } catch {
      setError("לא ניתן להתחבר כרגע. בדקו את החיבור לאינטרנט ונסו שוב.");
    } finally {
      setSending(false);
    }
  }

  const loginPath = next ? `/auth/login?redirectTo=${encodeURIComponent(safeRedirectPath(next, "/"))}` : "/auth/login";

  return (
    <section className="space-y-5 text-center" aria-labelledby="verify-email-title">
      <div className="brand-chip mx-auto flex h-16 w-16 justify-center" aria-hidden="true">
        <MailCheck className="h-8 w-8" />
      </div>
      <h1 id="verify-email-title" className="font-display text-4xl leading-tight text-ink">עוד שלב אחד: אימות המייל</h1>
      <p className="text-sm leading-relaxed text-stone-600">
        {justSent ? "שלחנו קישור אימות אל" : "צריך לאמת את כתובת המייל לפני הכניסה לחשבון"}
        <strong dir="ltr" className="mt-2 block break-all text-ink">{email}</strong>
      </p>
      <div className="brand-panel-soft p-4 text-start text-sm leading-relaxed text-ink">
        פתחו את ההודעה ולחצו על קישור האימות כדי להמשיך. עד לאימות החשבון לא ניתן להיכנס או לפרסם עסק.
        <p className="mt-2 text-stone-600">לא מצאתם? בדקו גם בספאם ובקידומי מכירות.</p>
      </div>
      {notice && <p role="status" className="brand-notice-success">{notice}</p>}
      {error && <p role="alert" className="brand-notice-error">{error}</p>}
      <button type="button" onClick={resend} disabled={sending || remaining > 0}
        className="brand-button inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 font-bold disabled:opacity-60">
        <RefreshCw className={`h-4 w-4 ${sending ? "animate-spin" : ""}`} aria-hidden="true" />
        {sending ? "שולחים…" : remaining > 0 ? `שליחה חוזרת בעוד ${remaining} שניות` : "שליחת מייל אימות מחדש"}
      </button>
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-semibold text-green-700">
        <Link href={loginPath} className="inline-flex min-h-11 items-center underline underline-offset-4">כבר אימתתי — כניסה לחשבון</Link>
        {onChangeEmail && <button type="button" onClick={onChangeEmail} className="min-h-11 underline underline-offset-4">תיקון כתובת המייל</button>}
      </div>
    </section>
  );
}
