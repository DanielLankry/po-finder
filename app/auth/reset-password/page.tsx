"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin } from "lucide-react";
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

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError("שגיאה בעדכון הסיסמה. נסו שוב.");
    } else {
      router.push("/auth/login?message=password_updated");
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

        <h1 className="font-display font-bold text-3xl text-stone-900 mb-1">
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
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="h-11 rounded-xl border-stone-200 focus-visible:ring-[#059669]"
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
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
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
            {loading ? "...מעדכן" : "עדכון סיסמה"}
          </Button>
        </form>
      </div>
    </div>
  );
}
