"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("הסיסמאות אינן תואמות.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) setError("שגיאה בעדכון הסיסמה. נסו שוב.");
      else router.push("/auth/login?message=password_updated");
    } catch {
      setError("שגיאה בעדכון הסיסמה. נסו שוב.");
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

        <h1 className="font-display font-bold text-3xl text-ink mb-1">
          סיסמה חדשה
        </h1>
        <p className="text-stone-500 text-sm mb-8">
          הזינו סיסמה חדשה לחשבון שלכם.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="password" className="text-stone-700 font-medium text-sm mb-1.5 block">
              סיסמה חדשה (לפחות 6 תווים)
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="h-11 rounded-xl border-stone-200 focus-visible:ring-[#2D6A4F]"
              dir="ltr"
            />
          </div>

          <div>
            <Label htmlFor="confirm" className="text-stone-700 font-medium text-sm mb-1.5 block">
              אימות סיסמה
            </Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
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
            {loading ? "...מעדכן" : "עדכון סיסמה"}
          </Button>
        </form>
      </div>
    </div>
  );
}
