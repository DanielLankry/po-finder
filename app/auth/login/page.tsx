"use client";

export const dynamic = "force-dynamic";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Typewriter } from "@/components/ui/typewriter";
import { Eye, EyeOff } from "lucide-react";
import { safeRedirectPath } from "@/lib/safe-redirect";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F3EA]" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirectTo");
  const explicitRedirect = rawRedirect ? safeRedirectPath(rawRedirect, "/") : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  const supabase = createClient();

  // Business owners land on /dashboard (which guards to /pricing without a
  // listing, payment credit, or renewal relationship) so auth flows converge.
  // Customers go home.
  async function postLoginDestination(userId: string): Promise<string> {
    if (explicitRedirect) return explicitRedirect;
    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    return data?.role === "business_owner" ? "/dashboard" : "/";
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setError("כתובת מייל או סיסמה שגויים. נסו שוב.");
    } else {
      const dest = await postLoginDestination(data.user.id);
      router.push(dest);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleGoogleLogin() {
    setLoading(true);
    const next = explicitRedirect ?? "/dashboard"; // role-based redirect happens server-side in /auth/callback
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) setError("שגיאה בכניסה עם גוגל.");
    setLoading(false);
  }

  return (
    <div
      className="brand-canvas min-h-screen flex"
      dir="rtl"
    >
      {/* ── Hero side — LEFT in RTL (desktop only) ─────────────────────────── */}
      <div className="brand-map-grid hidden lg:flex flex-1 relative overflow-hidden items-center justify-center border-l-2 border-[#17402D] p-12">
        {/* Map-style background grid */}
        <div className="absolute -right-12 top-20 h-32 w-32 rotate-12 rounded-[2rem] border-2 border-[#8A3618] bg-[#F6E3D9] shadow-[5px_5px_0_0_#8A3618]" aria-hidden="true" />
        <div className="absolute -left-8 bottom-16 h-24 w-24 -rotate-12 rounded-full border-2 border-[#17402D] bg-[#FFF3B0] shadow-[4px_4px_0_0_#17402D]" aria-hidden="true" />

        {/* Big center text */}
        <div className="relative z-10 text-center max-w-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="פה קרוב" className="h-20 w-auto mx-auto mb-6 drop-shadow-md" />
          <h2 className="font-display text-6xl text-[#17402D] mb-2 leading-none">
            הפלטפורמה
          </h2>
          <div className="font-display text-6xl text-[#2D6A4F] mb-4 h-16 flex items-center justify-center">
            <Typewriter
              text={["לעסקים קטנים", "לדוכנים", "לעגלות קפה", "ליוצרים", "לשווקים ניידים", "לאופים ביתיים", "למוכרי פרחים", "לחקלאים", "לישראלים"]}
              speed={65}
              deleteSpeed={35}
              waitTime={2000}
              wordColors={{ "לישראלים": "text-[#C4552D]" }}
            />
          </div>
          <p className="text-[#1F5038] text-lg font-medium opacity-80">
            על המפה, בזמן אמת
          </p>
          <div className="sticker mt-8 p-5 text-right -rotate-1">
            <p className="text-sm font-bold text-[#17402D] mb-2">כניסה לחשבון</p>
            <p className="text-sm text-[#1F5038] leading-relaxed">
              ניהול פרופיל עסק, שעות פעילות ותמונות או חזרה לחיפוש עסקים קרובים.
            </p>
          </div>
        </div>
      </div>

      {/* ── Form side — RIGHT in RTL ──────────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center p-5 sm:p-8 lg:p-14">
        <div className="brand-panel w-full max-w-[460px] p-6 sm:p-9">

          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Link href="/">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="פה קרוב" className="h-14 w-auto" />
            </Link>
          </div>

          {/* Tag */}
          <div className="inline-flex items-center gap-2 bg-white text-[#1F5038] text-xs font-bold px-3.5 py-1.5 rounded-full border-2 border-[#17402D] shadow-[2px_2px_0_0_#17402D] mb-5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2D6A4F] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2D6A4F]" />
            </span>
            כניסה לחשבון
          </div>

          <h1 className="font-display text-5xl text-[#17402D] mb-2 leading-none">
            ברוכים הבאים חזרה
          </h1>
          <p className="text-[#78716C] text-sm mb-8">
            אין לכם חשבון?{" "}
            <Link
              href={explicitRedirect && explicitRedirect !== "/" ? `/auth/register?redirectTo=${encodeURIComponent(explicitRedirect)}` : "/auth/register"}
              className="text-[#2D6A4F] font-semibold hover:underline"
            >
              צרו חשבון
            </Link>
          </p>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 h-12 px-4 rounded-2xl border-2 border-[#17402D]/20 bg-white text-[#17402D] font-bold text-sm shadow-[2px_2px_0_0_rgba(23,64,45,0.15)] hover:border-[#17402D] hover:shadow-[3px_3px_0_0_#17402D] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50"
          >
            <GoogleIcon />
            המשך עם גוגל
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#17402D]/15" />
            <span className="text-[#78716C] text-xs font-medium">או עם מייל</span>
            <div className="flex-1 h-px bg-[#17402D]/15" />
          </div>

          {/* Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-[#17402D] font-bold text-sm mb-2 block">
                כתובת מייל
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
                className="brand-control h-12 rounded-xl focus-visible:ring-0 text-sm px-4"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-[#17402D] font-bold text-sm mb-2 block">
                סיסמה
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  dir="ltr"
                  className="brand-control h-12 rounded-xl focus-visible:ring-0 text-sm px-4 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#9CA3AF] hover:bg-[#EFF5F0] hover:text-[#2D6A4F] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F]"
                  aria-label={showPass ? "הסתרת סיסמה" : "הצגת סיסמה"}
                >
                  {showPass ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="/auth/forgot-password" className="text-sm text-[#2D6A4F] hover:underline font-medium">
                שכחתם סיסמה?
              </Link>
            </div>

            {error && <p role="alert" className="text-red-500 text-sm bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="brand-button w-full h-12 rounded-xl font-bold text-[15px] transition-all disabled:opacity-60"
            >
              {loading ? "...נכנסים" : "כניסה"}
            </button>
          </form>

          <p className="text-center text-[11px] text-[#9CA3AF] mt-6">
            בכניסה אתם מסכימים ל
            <Link href="/terms" className="hover:underline">תנאי השימוש</Link>
            {" "}ול
            <Link href="/privacy" className="hover:underline">מדיניות הפרטיות</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return <Image src="/google-g.svg" alt="" width={18} height={18} aria-hidden="true" />;
}
