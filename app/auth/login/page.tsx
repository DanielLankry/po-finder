"use client";

export const dynamic = "force-dynamic";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("כתובת מייל או סיסמה שגויים. נסו שוב.");
    } else {
      router.push(redirectTo);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleGoogleLogin() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`,
      },
    });
    if (error) setError("שגיאה בכניסה עם גוגל. נסו שוב.");
    setLoading(false);
  }

  return (
    <div className="relative min-h-screen" dir="rtl">
      {/* Full-screen gradient background */}
      <BackgroundGradientAnimation
        gradientBackgroundStart="rgb(2, 44, 34)"
        gradientBackgroundEnd="rgb(1, 30, 22)"
        firstColor="5, 150, 105"
        secondColor="16, 185, 129"
        thirdColor="52, 211, 153"
        fourthColor="6, 95, 70"
        fifthColor="167, 243, 208"
        pointerColor="110, 231, 183"
        blendingValue="screen"
        interactive
      />

      {/* Centered login card */}
      <div className="absolute inset-0 flex items-center justify-center p-4 z-10">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-[0_32px_64px_rgba(0,0,0,0.4)] p-8">
          {/* Logo */}
          <div className="flex justify-center mb-7">
            <Link href="/">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="פה קרוב" className="h-12 w-auto brightness-0 invert" />
            </Link>
          </div>

          <h1 className="font-bold text-2xl text-white text-center mb-1">
            ברוכים הבאים חזרה
          </h1>
          <p className="text-white/60 text-sm text-center mb-7">
            אין לכם חשבון?{" "}
            <Link href="/auth/register" className="text-emerald-300 font-medium hover:text-emerald-200 hover:underline">
              הירשמו כאן
            </Link>
          </p>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 h-11 px-4 rounded-xl bg-white/90 hover:bg-white text-slate-700 font-medium text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:opacity-50 shadow-sm"
          >
            <GoogleIcon />
            כניסה עם גוגל
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-white/40 text-xs">או</span>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-white/80 font-medium text-sm mb-1.5 block">
                כתובת מייל
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-emerald-400 focus-visible:border-emerald-400"
                dir="ltr"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-white/80 font-medium text-sm mb-1.5 block">
                סיסמה
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-emerald-400"
                dir="ltr"
              />
            </div>

            <div className="flex justify-end">
              <Link href="/auth/forgot-password" className="text-sm text-emerald-300 hover:underline font-medium">
                שכחתם את הסיסמה?
              </Link>
            </div>

            {error && <p role="alert" className="text-red-300 text-sm">{error}</p>}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-semibold shadow-[0_4px_20px_rgba(5,150,105,0.4)] transition-all"
            >
              {loading ? "...נכנסים" : "כניסה"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"
        fill="#4285F4"
      />
      <path
        d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"
        fill="#34A853"
      />
      <path
        d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"
        fill="#FBBC05"
      />
      <path
        d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"
        fill="#EA4335"
      />
    </svg>
  );
}
