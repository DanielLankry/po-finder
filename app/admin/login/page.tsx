"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/admin");
    } else {
      setError("סיסמה שגויה");
      setLoading(false);
    }
  }

  return (
    <div className="brand-canvas min-h-screen flex items-center justify-center px-5 py-10" dir="rtl">
      <div className="brand-panel p-7 sm:p-10 w-full max-w-[460px]">
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-[#EFF5F0] flex items-center justify-center mx-auto mb-4">
            <Image src="/logo.png" alt="פה קרוב" width={56} height={56} />
          </div>
          <h1 className="font-display text-3xl text-ink">לוח ניהול פה קרוב</h1>
          <p className="text-[#888] text-sm mt-1">כניסה מוגבלת לצוות בלבד</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="סיסמת ניהול"
            required
            aria-label="סיסמת ניהול"
            autoComplete="current-password"
            className="brand-control w-full h-12 rounded-xl px-4 text-ink"
          />
          {error && <p role="alert" className="brand-notice-error">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="brand-button w-full h-12 rounded-xl font-bold transition-all disabled:opacity-60"
          >
            {loading ? "מתחבר..." : "כניסה"}
          </button>
        </form>
      </div>
    </div>
  );
}
