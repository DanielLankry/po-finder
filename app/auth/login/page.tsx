"use client";

export const dynamic = "force-dynamic";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <div className="flex min-h-screen" dir="rtl">
      {/* Form side — RIGHT in RTL */}
      <div className="flex flex-1 flex-col justify-center px-8 py-12 md:px-16 lg:px-24">
        {/* Logo */}
        <div className="mb-10">
          <Link href="/" className="inline-flex items-center gap-2 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="פה" className="h-10 w-auto" />
          </Link>
        </div>

        <div className="max-w-sm w-full fade-in-up">
          <h1 className="font-display font-bold text-3xl text-[#0A0A0A] mb-1">
            ברוכים הבאים חזרה
          </h1>
          <p className="text-slate-500 text-sm mb-8">
            אין לכם חשבון?{" "}
            <Link
              href="/auth/register"
              className="text-[#059669] font-medium hover:text-[#047857] hover:underline"
            >
              הירשמו כאן
            </Link>
          </p>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 h-11 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium text-sm hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-offset-2 disabled:opacity-50 btn-press shadow-sm"
          >
            <GoogleIcon />
            כניסה עם גוגל
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-slate-400 text-xs">או</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-slate-700 font-medium text-sm mb-1.5 block">
                כתובת מייל
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-xl border-slate-200 focus-visible:ring-[#059669] text-right"
                dir="ltr"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-slate-700 font-medium text-sm mb-1.5 block">
                סיסמה
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 rounded-xl border-slate-200 focus-visible:ring-[#059669]"
                dir="ltr"
              />
            </div>

            <div className="flex justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-[#059669] hover:underline font-medium"
              >
                שכחתם את הסיסמה?
              </Link>
            </div>

            {error && (
              <p role="alert" className="text-red-600 text-sm">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-medium shadow-[0_4px_14px_rgba(5,150,105,0.25)] hover:shadow-[0_6px_20px_rgba(5,150,105,0.3)] transition-all btn-press"
            >
              {loading ? "...נכנסים" : "כניסה"}
            </Button>
          </form>
        </div>
      </div>

      {/* Decorative side — LEFT in RTL (desktop only) */}
      <div
        className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #065F46 0%, #047857 50%, #064E3B 100%)",
        }}
      >
        {/* Subtle geometric pattern overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 80%, rgba(255,255,255,0.2) 1px, transparent 1px), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Soft glowing spheres */}
        <div className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full bg-[#10B981]/20 blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/4 w-56 h-56 rounded-full bg-[#A7F3D0]/10 blur-[80px]" />

        <div className="relative z-10 text-white text-center px-12">
          {/* Glassmorphic Icon Container */}
          <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-white/10 backdrop-blur-xl mb-8 shadow-[0_8px_32px_rgba(0,0,0,0.2)] border border-white/20">
            <MapPin className="h-10 w-10 fill-[#10B981] text-[#D1FAE5]" />
          </div>
          
          <p className="font-display font-bold text-5xl mb-6 tracking-tight drop-shadow-sm">פה</p>
          <div className="space-y-1">
            <p className="text-xl font-medium opacity-90 leading-relaxed">
              גלו את העסקים הקטנים
            </p>
            <p className="text-xl font-medium opacity-80">
              הכי קרובים אליכם
            </p>
          </div>
          <div className="mt-12 flex items-center justify-center gap-3 text-sm text-white/70 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 w-max mx-auto">
            <span className="relative flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34D399] opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
            </span>
            <span>מאות עסקים ברחבי הארץ</span>
          </div>
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
