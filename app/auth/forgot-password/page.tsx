"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
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

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      setError("שגיאה בשליחת הקישור. נסו שוב.");
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <MapPin className="h-7 w-7 fill-[#059669] text-[#059669]" />
            <span className="font-display font-extrabold text-2xl text-[#059669]">פה קרוב</span>
          </Link>
        </div>

        {sent ? (
          <div className="text-center py-8">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📬</span>
            </div>
            <h1 className="font-display font-bold text-2xl text-stone-900 mb-2">
              בדקו את המייל
            </h1>
            <p className="text-stone-500 text-sm">
              שלחנו קישור לאיפוס הסיסמה ל-<strong>{email}</strong>.
            </p>
            <Link href="/auth/login" className="text-[#059669] text-sm font-medium hover:underline mt-4 inline-block">
              חזרה לכניסה
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-display font-bold text-3xl text-stone-900 mb-1">
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
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 rounded-xl border-stone-200 focus-visible:ring-[#059669]"
                  dir="ltr"
                />
              </div>

              {error && <p role="alert" className="text-red-600 text-sm">{error}</p>}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-medium"
              >
                {loading ? "...שולח" : "שליחת קישור איפוס"}
              </Button>
            </form>

            <p className="text-center mt-6 text-sm text-stone-500">
              <Link href="/auth/login" className="text-[#059669] font-medium hover:underline">
                חזרה לכניסה
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
