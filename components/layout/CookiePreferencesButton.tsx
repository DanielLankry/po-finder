"use client";

export default function CookiePreferencesButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("po-cookie-consent-open"))}
      className="text-slate-500 text-sm hover:text-[#059669] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] rounded"
    >
      העדפות עוגיות
    </button>
  );
}
