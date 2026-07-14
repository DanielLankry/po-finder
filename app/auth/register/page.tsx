"use client";

export const dynamic = "force-dynamic";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, MailCheck, Store, ShoppingCart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Typewriter } from "@/components/ui/typewriter";
import type { UserRole } from "@/lib/types";
import { safeRedirectPath } from "@/lib/safe-redirect";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F3EA]" />}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // /pricing pushes new visitors here with ?redirectTo=/pricing so they land
  // back on checkout the moment their session exists.
  const rawRedirect = searchParams.get("redirectTo");
  const redirectTo = rawRedirect ? safeRedirectPath(rawRedirect, "/") : null;
  const isPricingSignup = redirectTo?.startsWith("/pricing") ?? false;
  const [role, setRole] = useState<UserRole>(() => (isPricingSignup ? "business_owner" : "customer"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const supabase = createClient();

  function defaultRoute() {
    if (redirectTo) return redirectTo;
    return role === "business_owner" ? "/dashboard" : "/";
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const callbackUrl = redirectTo
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`
      : `${window.location.origin}/auth/callback`;

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
        emailRedirectTo: callbackUrl,
      },
    });

    if (signUpError) { setError(signUpError.message); setLoading(false); return; }

    if (data.user && !data.session) { setEmailSent(true); setLoading(false); return; }

    if (data.user && data.session) {
      await supabase.from("users").insert({ id: data.user.id, email, role, name });
      router.push(defaultRoute());
      router.refresh();
    }
    setLoading(false);
  }

  async function handleGoogleRegister() {
    setLoading(true);
    const callbackUrl = redirectTo
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`
      : `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl, queryParams: { role } },
    });
    if (error) setError("שגיאה בהרשמה עם גוגל.");
    setLoading(false);
  }

  return (
    <div
      className="brand-canvas min-h-screen flex"
      dir="rtl"
      
    >
      {/* ── Hero side — LEFT in RTL (desktop only) ─────────────────────────── */}
      <div className="brand-map-grid hidden lg:flex flex-1 relative overflow-hidden items-center justify-center border-l-2 border-[#17402D] p-12">
        <div className="absolute -right-12 top-20 h-32 w-32 rotate-12 rounded-[2rem] border-2 border-[#8A3618] bg-[#F6E3D9] shadow-[5px_5px_0_0_#8A3618]" aria-hidden="true" />
        <div className="absolute -left-8 bottom-16 h-24 w-24 -rotate-12 rounded-full border-2 border-[#17402D] bg-[#FFF3B0] shadow-[4px_4px_0_0_#17402D]" aria-hidden="true" />
        <div className="relative z-10 text-center max-w-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="פה קרוב" className="h-20 w-auto mx-auto mb-6 drop-shadow-md" />
          <h2 className="font-display text-6xl text-[#17402D] mb-2 leading-none">הפלטפורמה</h2>
          <div className="font-display text-6xl text-[#2D6A4F] mb-4 h-16 flex items-center justify-center">
            <Typewriter
              text={["לעסקים קטנים", "לדוכנים", "לעגלות קפה", "ליוצרים", "לשווקים ניידים", "לאופים ביתיים", "לחקלאים", "לישראלים"]}
              speed={65}
              deleteSpeed={35}
              waitTime={2000}
              wordColors={{ "לישראלים": "text-[#C4552D]" }}
            />
          </div>
          <p className="text-[#1F5038] text-lg font-medium opacity-80">על המפה, בזמן אמת</p>
          <div className="sticker mt-8 p-5 text-right rotate-1">
            <p className="text-sm font-bold text-[#17402D] mb-2">מה מקבלים?</p>
            <p className="text-sm text-[#1F5038] leading-relaxed">
              פרופיל עסק, מיקום, שעות פעילות, תמונות וכפתור התקשרות במקום אחד.
            </p>
          </div>
        </div>
      </div>

      {/* ── Form side — RIGHT in RTL ──────────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center p-5 sm:p-8 lg:p-12 overflow-y-auto">
        <div className="brand-panel w-full max-w-[460px] p-6 sm:p-8 my-5">

          {/* Mobile logo */}
          <div className="flex justify-center mb-6 lg:hidden">
            <Link href="/">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="פה קרוב" className="h-12 w-auto" />
            </Link>
          </div>

          {/* Email sent screen */}
          {emailSent && (
            <div className="text-center py-8 bg-white rounded-3xl p-8 shadow-sm border border-[#17402D]/20">
              <MailCheck className="mx-auto mb-4 h-12 w-12 text-[#2D6A4F]" aria-hidden="true" />
              <h2 className="font-bold text-2xl text-[#111111] mb-2">בדקו את המייל שלכם</h2>
              <p className="text-[#78716C] text-sm leading-relaxed">
                שלחנו קישור אימות לכתובת <strong>{email}</strong>.<br />
                לחצו עליו כדי להפעיל את החשבון.
              </p>
              <p className="text-xs text-[#A8A29E] mt-4">לא קיבלתם? בדקו תיקיית ספאם</p>
            </div>
          )}

          {!emailSent && (
            <>
              <div className="inline-flex items-center gap-1.5 bg-[#2D6A4F]/10 text-[#1F5038] text-xs font-bold px-3 py-1.5 rounded-full mb-5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2D6A4F] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2D6A4F]" />
                </span>
                {isPricingSignup ? "המשך לבחירת משך ההופעה" : "פתיחת חשבון לעסקים ולקוחות"}
              </div>

              <h1 className="font-display text-5xl text-[#17402D] mb-2 leading-none">
                {isPricingSignup ? "כמעט סיימנו: פתחו חשבון להצטרפות" : "יצירת חשבון חדש"}
              </h1>
              <p className="text-[#78716C] text-sm mb-6">
                כבר יש לכם חשבון?{" "}
                <Link
                  href={redirectTo ? `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}` : "/auth/login"}
                  className="text-[#2D6A4F] font-semibold hover:underline"
                >כניסה כאן</Link>
              </p>

              {/* Role selector */}
              <div className="mb-5">
                <p className="text-[#17402D] font-semibold text-sm mb-3">אני מצטרף/ת בתור:</p>
                <div className="grid grid-cols-2 gap-3">
                  <RoleCard active={role === "business_owner"} onClick={() => setRole("business_owner")}
                    icon={<Store className="h-5 w-5" />} title="בעל עסק" description="פרסום בתשלום חד־פעמי" />
                  <RoleCard active={role === "customer"} onClick={() => setRole("customer")}
                    icon={<ShoppingCart className="h-5 w-5" />} title="לקוח" description="גלשו והשאירו ביקורת" />
                </div>
              </div>

              {/* Google */}
              <button type="button" onClick={handleGoogleRegister} disabled={loading}
                className="w-full flex items-center justify-center gap-3 h-12 px-4 rounded-2xl border-2 border-[#17402D]/20 bg-white text-[#17402D] font-semibold text-sm hover:border-[#2D6A4F]/40 hover:bg-white transition-all disabled:opacity-50 shadow-sm">
                <GoogleIcon />הרשמה עם גוגל
              </button>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-[#17402D]/15" />
                <span className="text-[#A8A29E] text-xs font-medium">או עם מייל</span>
                <div className="flex-1 h-px bg-[#17402D]/15" />
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-[#17402D] font-semibold text-sm mb-2 block">שם מלא</Label>
                  <Input id="name" type="text" placeholder="ישראל ישראלי" value={name}
                    onChange={(e) => setName(e.target.value)} required
                    className="brand-control h-12 rounded-xl focus-visible:ring-0 text-sm" />
                </div>
                <div>
                  <Label htmlFor="email" className="text-[#17402D] font-semibold text-sm mb-2 block">כתובת מייל</Label>
                  <Input id="email" type="email" placeholder="your@email.com" value={email}
                    onChange={(e) => setEmail(e.target.value)} required dir="ltr"
                    className="brand-control h-12 rounded-xl focus-visible:ring-0 text-sm" />
                </div>
                <div>
                  <Label htmlFor="password" className="text-[#17402D] font-semibold text-sm mb-2 block">סיסמה (לפחות 6 תווים)</Label>
                  <div className="relative">
                    <Input id="password" type={showPass ? "text" : "password"} placeholder="••••••••" value={password}
                      onChange={(e) => setPassword(e.target.value)} required minLength={6} dir="ltr"
                      className="brand-control h-12 rounded-xl focus-visible:ring-0 text-sm pr-12" />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#A8A29E] hover:bg-[#EFF5F0] hover:text-[#2D6A4F] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F]"
                      aria-label={showPass ? "הסתרת סיסמה" : "הצגת סיסמה"}>
                      {showPass ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                {error && <p role="alert" className="text-red-500 text-sm bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}

                <button type="submit" disabled={loading}
                  className="brand-button w-full h-12 rounded-xl font-bold text-[15px] transition-all disabled:opacity-60">
                  {loading ? "...נרשמים" : isPricingSignup ? "יצירת חשבון והמשך לתשלום" : "יצירת חשבון"}
                </button>
              </form>

              <p className="text-center text-[11px] text-[#A8A29E] mt-5">
                בהרשמה אתם מסכימים ל<Link href="/terms" className="hover:underline">תנאי השימוש</Link>
                {" "}ול<Link href="/privacy" className="hover:underline">מדיניות הפרטיות</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RoleCard({ active, onClick, icon, title, description }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; title: string; description: string;
}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2 ${
        active ? "border-[#17402D] bg-[#FFF3B0] text-[#17402D] shadow-[3px_3px_0_0_#17402D] -translate-y-0.5" : "border-[#17402D]/25 bg-white text-[#78716C] shadow-[2px_2px_0_0_rgba(23,64,45,0.14)] hover:border-[#2D6A4F] hover:bg-[#EFF5F0]"
      }`}>
      <span className={`transition-colors ${active ? "text-[#2D6A4F]" : "text-[#A8A29E]"}`}>{icon}</span>
      <span className="font-bold text-sm">{title}</span>
      <span className="text-xs opacity-75">{description}</span>
    </button>
  );
}

function GoogleIcon() {
  return <Image src="/google-g.svg" alt="" width={18} height={18} aria-hidden="true" />;
}
