"use client";

import { useEffect, useState } from "react";

interface Item {
  id: string; attempt_id: string; event_type: string; recipient: string | null;
  status: string; attempts: number; created_at: string; last_error: string | null;
  provider_message_id: string | null;
}
const labels: Record<string, string> = {
  payment_succeeded: "תשלום התקבל", listing_renewed: "חידוש פרסום", payment_refunded: "החזר בוצע",
  pending: "ממתין לניסיון שליחה", sending: "בשליחה", accepted: "התקבל אצל ספק המייל", needs_attention: "דורש טיפול",
  delivery_uncertain_expired: "יש לבדוק ב־Resend אם ההודעה נשלחה לפני ניסיון נוסף", provider_rejected: "ספק המייל דחה את הבקשה",
  delivery_uncertain: "תוצאת השליחה עדיין אינה ודאית", recipient_missing: "חסרה כתובת מייל תקינה",
};
export default function PaymentEmailsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function load(send = false) {
    setBusy(true); setError(""); setMessage("");
    try {
      if (send) {
        const response = await fetch("/api/admin/payment-emails", { method: "POST" });
        if (!response.ok) throw new Error();
        const result = await response.json();
        setMessage(`התקבלו אצל הספק: ${result.accepted}. ניסיונות שנכשלו: ${result.failed}.`);
      }
      const response = await fetch("/api/admin/payment-emails", { cache: "no-store" });
      if (!response.ok) throw new Error();
      setItems((await response.json()).items ?? []);
    } catch { setError("לא ניתן להשלים את הבקשה. נסו שוב."); }
    finally { setBusy(false); }
  }
  useEffect(() => { void load(); }, []);
  return <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8" dir="rtl">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="font-display text-3xl text-[#17402D]">הודעות תשלום</h1>
      <div className="flex flex-wrap gap-3">
        <button className="brand-button min-h-11 rounded-xl border-2 border-[#17402D] px-4" disabled={busy} onClick={() => void load()}>רענון</button>
        <button className="brand-button min-h-11 rounded-xl border-2 border-[#8A3618] bg-[#C4552D] px-4 text-white" disabled={busy} onClick={() => void load(true)}>שליחת הודעות שממתינות</button>
      </div>
    </div>
    <p className="text-sm leading-7 text-stone-600">השליחה הראשונה מתבצעת לאחר התשלום או ההחזר. השלמה אוטומטית פועלת מדי יום; אפשר להפעיל אותה גם כאן. הודעה שהתקבלה אצל הספק עדיין אינה אישור שהגיעה לתיבת הדואר. הודעות שדורשות טיפול מחייבות בדיקה ב־Resend.</p>
    {error && <p role="alert" className="rounded-xl border-2 border-red-700 bg-red-50 p-4 text-red-800">{error}</p>}
    {message && <p role="status">{message}</p>}
    {busy && <p role="status">טוען הודעות…</p>}
    {!busy && !error && !items.length && <p className="rounded-xl border-2 border-[#17402D] bg-[#FFFDF7] p-6">עדיין אין הודעות תשלום. הודעות יופיעו כאן לאחר תשלום או החזר חדש.</p>}
    <div className="space-y-4" aria-busy={busy}>
      {items.map(item => <article key={item.id} className="space-y-2 break-words rounded-xl border-2 border-[#17402D] bg-[#FFFDF7] p-5 shadow-[3px_3px_0_#17402D]">
        <div className="flex flex-wrap justify-between gap-3"><h2 className="font-bold">{labels[item.event_type]}</h2><strong className={item.status === "needs_attention" ? "text-red-700" : "text-[#17402D]"}>{labels[item.status]}</strong></div>
        <p dir="ltr" className="text-right">{item.recipient ?? "חסרה כתובת מייל"}</p>
        <p className="text-sm text-stone-600">{new Date(item.created_at).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" })} · ניסיונות: {item.attempts}</p>
        {item.last_error && <p className="text-sm text-red-700">{labels[item.last_error] ?? "נדרשת בדיקת השליחה"}</p>}
        <p className="text-xs text-stone-600">אסמכתת תשלום: <bdi>{item.attempt_id}</bdi></p>
        {item.provider_message_id && <p className="text-xs text-stone-600">מזהה הודעה ב־Resend: <bdi>{item.provider_message_id}</bdi></p>}
      </article>)}
    </div>
  </div>;
}
