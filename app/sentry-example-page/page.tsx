"use client";
import * as Sentry from "@sentry/nextjs";

export default function SentryExamplePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6" dir="rtl">
      <h1 className="text-2xl font-bold text-stone-800">בדיקת Sentry</h1>
      <p className="text-stone-500">לחץ על הכפתור כדי לשלוח שגיאת בדיקה ל-Sentry</p>
      <button
        className="px-6 py-3 bg-[#059669] text-white rounded-xl font-medium hover:bg-[#047857] transition-colors"
        onClick={() => {
          Sentry.captureException(new Error("Sentry test error from pokarov.co.il"));
          throw new Error("Sentry test error from pokarov.co.il");
        }}
      >
        שלח שגיאת בדיקה
      </button>
    </div>
  );
}
