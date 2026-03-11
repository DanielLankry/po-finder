"use client";

export const dynamic = "force-dynamic";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Typewriter } from "@/components/ui/typewriter";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAF7]" />}>
      <LoginForm />
    </Suspense>
  );
}

// Business cards for marquee rows
const MARQUEE_ROW1 = [
  { emoji: "☕", name: "קפה הפינה", sub: "שוק הכרמל · פתוח עכשיו", color: "#FEF3C7", text: "#92400E" },
  { emoji: "🧆", name: "פלאפל אבו חסן", sub: "יפו · ⭐ 4.9", color: "#FFEDD5", text: "#C2410C" },
  { emoji: "🌸", name: "ורדינה פרחים", sub: "פתח תקווה · פתוח עכשיו", color: "#FDF2F8", text: "#9D174D" },
  { emoji: "🥐", name: "עוגות של סבתא", sub: "רמת גן · כשר למהדרין", color: "#FCE7F3", text: "#BE185D" },
  { emoji: "💎", name: "תכשיטי לאה", sub: "תל אביב · ⭐ 5.0", color: "#EDE9FE", text: "#5B21B6" },
  { emoji: "🌿", name: "ירוק טבעי", sub: "הרצליה · טבעוני", color: "#DCFCE7", text: "#166534" },
];
const MARQUEE_ROW2 = [
  { emoji: "🍰", name: "מאפיית לילה", sub: "ראשון לציון · ⭐ 4.8", color: "#FCE7F3", text: "#BE185D" },
  { emoji: "🥩", name: "הבשר שלנו", sub: "בני ברק · כשר", color: "#FEE2E2", text: "#991B1B" },
  { emoji: "👗", name: "וינטאג׳ by Dana", sub: "פלורנטין · פתוח עכשיו", color: "#F5F0FF", text: "#6D28D9" },
  { emoji: "☕", name: "אספרסו בר", sub: "נווה צדק · ⭐ 4.7", color: "#FEF3C7", text: "#92400E" },
  { emoji: "🌾", name: "ללא גלוטן בשבילך", sub: "גבעתיים · ⭐ 4.9", color: "#FEF9C3", text: "#78350F" },
  { emoji: "🍽️", name: "שולחן משפחתי", sub: "חיפה · פתוח עכשיו", color: "#FFEDD5", text: "#C2410C" },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  const supabase = createClient();

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError("כתובת מייל או סיסמה שגויים. נסו שוב.");
    else { router.push(redirectTo); router.refresh(); }
    setLoading(false);
  }

  async function handleGoogleLogin() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}` },
    });
    if (error) setError("שגיאה בכניסה עם גוגל.");
    setLoading(false);
  }

  return (
    <div
      className="min-h-screen flex"
      dir="rtl"
      style={{ background: "linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 40%, #D1FAE5 100%)" }}
    >
      {/* ── Hero side — LEFT in RTL (desktop only) ─────────────────────────── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center p-12">
        {/* Map-style background grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "linear-gradient(#059669 1px, transparent 1px), linear-gradient(90deg, #059669 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Big center text */}
        <div className="relative z-10 text-center max-w-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="פה קרוב" className="h-20 w-auto mx-auto mb-6 drop-shadow-md" />
          <h2 className="text-4xl font-black text-[#065F46] mb-2 leading-tight">
            הפלטפורמה
          </h2>
          <div className="text-4xl font-black text-[#059669] mb-3 h-12 flex items-center">
            <Typewriter
              text={["לעסקים קטנים", "לדוכנים", "לעגלות קפה", "ליוצרים", "לשווקים ניידים", "לאופים ביתיים", "לפרחנים", "לישראלים"]}
              speed={65}
              deleteSpeed={35}
              waitTime={2000}
            />
          </div>
          <p className="text-[#047857] text-lg font-medium opacity-80">
            על המפה, בזמן אמת
          </p>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-6 mt-8">
            {[["500+", "עסקים"], ["10K+", "משתמשים"], ["כל יום", "מתעדכן"]].map(([num, label]) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-black text-[#059669]">{num}</div>
                <div className="text-xs text-[#065F46]/70 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Marquee rows */}
        <style>{`
          @keyframes marquee-ltr { from { transform: translateX(0); } to { transform: translateX(-50%); } }
          @keyframes marquee-rtl { from { transform: translateX(-50%); } to { transform: translateX(0); } }
        `}</style>
        <div className="absolute inset-x-0 bottom-10 flex flex-col gap-3 pointer-events-none overflow-hidden">
          {/* Row 1 — left to right */}
          <div className="flex" style={{ animation: "marquee-ltr 28s linear infinite" }}>
            {[...MARQUEE_ROW1, ...MARQUEE_ROW1].map((c, i) => (
              <div
                key={i}
                className="flex-shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl shadow-md border border-white/60 mx-2"
                style={{ backgroundColor: c.color }}
              >
                <span className="text-xl">{c.emoji}</span>
                <div>
                  <div className="text-xs font-bold whitespace-nowrap" style={{ color: c.text }}>{c.name}</div>
                  <div className="text-[10px] opacity-70 whitespace-nowrap" style={{ color: c.text }}>{c.sub}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Row 2 — right to left (opposite direction) */}
          <div className="flex" style={{ animation: "marquee-rtl 34s linear infinite" }}>
            {[...MARQUEE_ROW2, ...MARQUEE_ROW2].map((c, i) => (
              <div
                key={i}
                className="flex-shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl shadow-md border border-white/60 mx-2"
                style={{ backgroundColor: c.color }}
              >
                <span className="text-xl">{c.emoji}</span>
                <div>
                  <div className="text-xs font-bold whitespace-nowrap" style={{ color: c.text }}>{c.name}</div>
                  <div className="text-[10px] opacity-70 whitespace-nowrap" style={{ color: c.text }}>{c.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Form side — RIGHT in RTL ──────────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-[420px]">

          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Link href="/">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="פה קרוב" className="h-14 w-auto" />
            </Link>
          </div>

          {/* Tag */}
          <div className="inline-flex items-center gap-1.5 bg-[#059669]/10 text-[#047857] text-xs font-bold px-3 py-1.5 rounded-full mb-5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#059669] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#059669]" />
            </span>
            כניסה לחשבון
          </div>

          <h1 className="text-[32px] font-black text-[#111111] mb-1.5 leading-tight">
            ברוכים הבאים חזרה 👋
          </h1>
          <p className="text-[#6B7280] text-sm mb-8">
            אין לכם חשבון?{" "}
            <Link href="/auth/register" className="text-[#059669] font-semibold hover:underline">
              הירשמו בחינם
            </Link>
          </p>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 h-12 px-4 rounded-2xl border-2 border-[#E5E7EB] bg-white text-[#374151] font-semibold text-sm hover:border-[#059669]/40 hover:bg-[#F9FFF9] transition-all duration-150 disabled:opacity-50 shadow-sm"
          >
            <GoogleIcon />
            המשך עם גוגל
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#E5E7EB]" />
            <span className="text-[#9CA3AF] text-xs font-medium">או עם מייל</span>
            <div className="flex-1 h-px bg-[#E5E7EB]" />
          </div>

          {/* Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-[#374151] font-semibold text-sm mb-2 block">
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
                className="h-12 rounded-2xl border-2 border-[#E5E7EB] focus-visible:border-[#059669] focus-visible:ring-0 bg-white text-sm px-4"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-[#374151] font-semibold text-sm mb-2 block">
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
                  className="h-12 rounded-2xl border-2 border-[#E5E7EB] focus-visible:border-[#059669] focus-visible:ring-0 bg-white text-sm px-4 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#059669] text-xs font-medium transition-colors"
                >
                  {showPass ? "הסתר" : "הצג"}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="/auth/forgot-password" className="text-sm text-[#059669] hover:underline font-medium">
                שכחתם סיסמה?
              </Link>
            </div>

            {error && <p role="alert" className="text-red-500 text-sm bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-2xl bg-[#059669] hover:bg-[#047857] active:scale-[0.98] text-white font-bold text-[15px] transition-all shadow-[0_4px_20px_rgba(5,150,105,0.3)] hover:shadow-[0_6px_24px_rgba(5,150,105,0.4)] disabled:opacity-60"
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

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z" fill="#4285F4" />
      <path d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z" fill="#34A853" />
      <path d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z" fill="#FBBC05" />
      <path d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z" fill="#EA4335" />
    </svg>
  );
}
