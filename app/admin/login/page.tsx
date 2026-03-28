"use client";
import { useState } from "react";
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
    <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center" dir="rtl">
      <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-sm p-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-[#ECFDF5] flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="35" viewBox="0 0 40 50" fill="none"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#34d399"/><stop offset="100%" stopColor="#059669"/></linearGradient></defs><path d="M20 0C9.507 0 1 8.507 1 19c0 13.255 17.5 29.5 18.25 30.188a1.125 1.125 0 0 0 1.5 0C21.5 48.5 39 32.255 39 19 39 8.507 30.493 0 20 0z" fill="url(#g)"/><text x="20" y="26" textAnchor="middle" fontFamily="sans-serif" fontWeight="800" fontSize="20" fill="white">פ</text></svg>
          </div>
          <h1 className="font-extrabold text-xl text-[#111]">לוח ניהול פוקרוב</h1>
          <p className="text-[#888] text-sm mt-1">כניסה מוגבלת לצוות בלבד</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="סיסמת ניהול"
            required
            className="w-full h-12 rounded-xl border border-[#E5E7EB] bg-[#FAFAF7] px-4 text-[#111] focus:outline-none focus:ring-2 focus:ring-[#059669] focus:bg-white transition-all"
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl text-white font-bold transition-all disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #059669, #047857)" }}
          >
            {loading ? "מתחבר..." : "כניסה"}
          </button>
        </form>
      </div>
    </div>
  );
}
