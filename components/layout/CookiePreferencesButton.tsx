"use client";

export default function CookiePreferencesButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("po-cookie-consent-open"))}
      className="text-slate-500 text-sm hover:text-[#2D6A4F] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] rounded"
    >
      העדפות עוגיות
    </button>
  );
}
