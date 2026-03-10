"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, Store, ShoppingCart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserRole } from "@/lib/types";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const supabase = createClient();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      // Show the real Supabase error so we know what's wrong
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Supabase returns a user but no session when email confirmation is required
    if (data.user && !data.session) {
      setEmailSent(true);
      setLoading(false);
      return;
    }

    if (data.user && data.session) {
      // Insert user profile row (only when session is active)
      await supabase.from("users").insert({
        id: data.user.id,
        email,
        role,
        name,
      });

      router.push(role === "business_owner" ? "/dashboard" : "/");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleGoogleRegister() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { role },
      },
    });
    if (error) setError("שגיאה בהרשמה עם גוגל. נסו שוב.");
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen" dir="rtl">
      {/* Form side — RIGHT in RTL */}
      <div className="flex flex-1 flex-col justify-center px-8 py-12 md:px-16 lg:px-24 overflow-y-auto">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="פה" className="h-10 w-auto" />
          </Link>
        </div>

        <div className="max-w-sm w-full fade-in-up">

          {/* Email confirmation sent screen */}
          {emailSent && (
            <div className="text-center py-8">
              <div className="h-16 w-16 rounded-full bg-[#ECFDF5] flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📬</span>
              </div>
              <h2 className="font-display font-bold text-2xl text-[#222222] mb-2">בדקו את המייל שלכם</h2>
              <p className="text-[#717171] text-sm leading-relaxed">
                שלחנו קישור אימות לכתובת <strong>{email}</strong>.<br />
                לחצו עליו כדי להפעיל את החשבון.
              </p>
              <p className="text-xs text-[#AAAAAA] mt-4">
                לא קיבלתם? בדקו תיקיית ספאם
              </p>
            </div>
          )}

          {!emailSent && <h1 className="font-display font-bold text-3xl text-slate-900 mb-1">
            יצירת חשבון חדש
          </h1>}
          <p className="text-slate-500 text-sm mb-6">
            כבר יש לכם חשבון?{" "}
            <Link
              href="/auth/login"
              className="text-blue-600 font-medium hover:text-blue-700 hover:underline"
            >
              כניסה כאן
            </Link>
          </p>

          {/* Role selector */}
          <div className="mb-6">
            <p className="text-slate-700 font-medium text-sm mb-3">
              אני מצטרף/ת בתור:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <RoleCard
                active={role === "business_owner"}
                onClick={() => setRole("business_owner")}
                icon={<Store className="h-6 w-6" />}
                title="בעל עסק"
                description="הוסיפו את העסק שלכם"
              />
              <RoleCard
                active={role === "customer"}
                onClick={() => setRole("customer")}
                icon={<ShoppingCart className="h-6 w-6" />}
                title="לקוח"
                description="גלשו והשאירו ביקורת"
              />
            </div>
          </div>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 h-11 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium text-sm hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-50 btn-press shadow-sm"
          >
            <GoogleIcon />
            הרשמה עם גוגל
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-slate-400 text-xs">או</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-slate-700 font-medium text-sm mb-1.5 block">
                שם מלא
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="ישראל ישראלי"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11 rounded-xl border-slate-200 focus-visible:ring-blue-600"
              />
            </div>

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
                className="h-11 rounded-xl border-slate-200 focus-visible:ring-blue-600 text-right"
                dir="ltr"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-slate-700 font-medium text-sm mb-1.5 block">
                סיסמה (לפחות 6 תווים)
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-11 rounded-xl border-slate-200 focus-visible:ring-blue-600"
                dir="ltr"
              />
            </div>

            {error && (
              <p role="alert" className="text-red-600 text-sm">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm btn-press"
            >
              {loading ? "...נרשמים" : "יצירת חשבון"}
            </Button>
          </form>
        </div>
      </div>

      {/* Decorative side — LEFT in RTL */}
      <div
        className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 45%, #1E3A8A 100%)",
        }}
      >
        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 80%, #ffffff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #ffffff 1px, transparent 1px), radial-gradient(circle at 50% 50%, #ffffff 0.5px, transparent 0.5px)",
            backgroundSize: "60px 60px, 60px 60px, 30px 30px",
          }}
        />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-blue-400/30 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 rounded-full bg-indigo-300/20 blur-3xl" />

        <div className="relative z-10 text-white text-center px-12">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-white/15 backdrop-blur-sm mb-6 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="פה" className="h-12 w-auto" />
          </div>
          <p className="font-display font-extrabold text-5xl mb-4 tracking-tight">פה</p>
          <p className="text-xl font-medium opacity-90 leading-relaxed">
            גלו את העסקים הקטנים
          </p>
          <p className="text-xl font-medium opacity-90">
            הכי קרובים אליכם
          </p>
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-white/60">
            <span className="h-1.5 w-1.5 rounded-full bg-white/60 inline-block" />
            <span>מאות עסקים ברחבי הארץ</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleCard({
  active,
  onClick,
  icon,
  title,
  description,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 btn-press ${
        active
          ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
          : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50/50"
      }`}
      aria-pressed={active}
    >
      <span className={`transition-colors ${active ? "text-blue-600" : "text-slate-400"}`}>{icon}</span>
      <span className="font-semibold text-sm">{title}</span>
      <span className="text-xs opacity-75">{description}</span>
    </button>
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
