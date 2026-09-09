"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/auth/reset-password")}`,
      });
      if (error) setError("שגיאה בשליחת הקישור. נסו שוב.");
      else setSent(true);
    } catch {
      setError("שגיאה בשליחת הקישור. נסו שוב.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="brand-canvas flex min-h-screen items-center justify-center px-5 py-10" dir="rtl">
      <div className="brand-panel w-full max-w-[460px] p-6 sm:p-9">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <Image src="/logo.png" alt="" width={40} height={40} />
            <span className="font-display font-extrabold text-2xl text-[#2D6A4F]">פה קרוב</span>
          </Link>
        </div>

        {sent ? (
          <div className="text-center py-8">
            <div className="brand-chip h-16 w-16 justify-center mx-auto mb-4">
              <MailCheck className="h-8 w-8" aria-hidden="true" />
            </div>
            <h1 className="font-display font-bold text-2xl text-ink mb-2">
              בדקו את המייל
            </h1>
            <p className="text-stone-500 text-sm">
              אם קיים חשבון עם הכתובת <strong dir="ltr" className="break-all">{email}</strong>, יישלח אליו קישור לאיפוס הסיסמה. בדקו גם בספאם.
            </p>
            <Link href="/auth/login" className="text-[#2D6A4F] text-sm font-medium hover:underline mt-4 inline-block">
              חזרה לכניסה
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-display font-bold text-3xl text-ink mb-1">
              שכחתם את הסיסמה?
            </h1>
            <p className="text-stone-500 text-sm mb-8">
              הזינו את כתובת המייל ונשלח לכם קישור לאיפוס.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-stone-700 font-medium text-sm mb-1.5 block">
                  כתובת מייל
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 rounded-xl border-stone-200 focus-visible:ring-[#2D6A4F]"
                  dir="ltr"
                />
              </div>

              {error && <p role="alert" className="brand-notice-error">{error}</p>}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-[#C4552D] hover:bg-[#A8441F] text-white font-bold border-2 border-[#8A3618] shadow-[2px_2px_0_0_#8A3618] transition-all"
              >
                {loading ? "...שולח" : "שליחת קישור איפוס"}
              </Button>
            </form>

            <p className="text-center mt-6 text-sm text-stone-500">
              <Link href="/auth/login" className="text-[#2D6A4F] font-medium hover:underline">
                חזרה לכניסה
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
