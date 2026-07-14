"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function openPreferences() {
      setVisible(true);
    }

    const consent = localStorage.getItem("po-cookie-consent");
    if (!consent) queueMicrotask(() => setVisible(true));

    window.addEventListener("po-cookie-consent-open", openPreferences);
    return () => window.removeEventListener("po-cookie-consent-open", openPreferences);
  }, []);

  function accept() {
    localStorage.setItem("po-cookie-consent", "accepted");
    window.dispatchEvent(new Event("po-cookie-consent-accepted"));
    setVisible(false);
  }

  function decline() {
    localStorage.setItem("po-cookie-consent", "declined");
    window.dispatchEvent(new Event("po-cookie-consent-declined"));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom))] inset-x-0 z-[60] p-3 sm:p-4 fade-in min-[1440px]:bottom-0"
      dir="rtl"
      role="dialog"
      aria-label="הסכמה לעוגיות"
      aria-modal="false"
    >
      <div className="brand-panel-soft pointer-events-auto max-w-2xl mx-auto p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-stone-900 font-medium text-sm mb-1">
            האתר משתמש בעוגיות
          </p>
          <p className="text-stone-500 text-xs leading-relaxed">
            אנו משתמשים בעוגיות הכרחיות להפעלת האתר. עוגיות אנליטיקה אופציונליות
            יופעלו רק לאחר אישור. אפשר לשנות בחירה דרך תחתית האתר. לפרטים ראו את{" "}
            <Link
              href="/privacy"
              className="text-[#2D6A4F] hover:underline"
            >
              מדיניות הפרטיות
            </Link>{" "}
            שלנו.
          </p>
        </div>
        <div className="flex w-full items-center gap-2 flex-shrink-0 sm:w-auto">
          <button
            onClick={decline}
            className="h-11 flex-1 px-4 rounded-xl border-2 border-[#17402D]/25 text-stone-700 text-sm font-bold hover:bg-[#EFF5F0] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] sm:flex-none"
          >
            דחייה
          </button>
          <button
            onClick={accept}
            className="h-11 flex-1 px-4 rounded-xl bg-[#2D6A4F] text-white text-sm font-bold hover:bg-[#1F5038] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2 sm:flex-none"
          >
            אישור
          </button>
        </div>
      </div>
    </div>
  );
}
