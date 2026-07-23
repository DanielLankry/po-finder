"use client";

export default function CookiePreferencesButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("po-cookie-consent-open"))}
      className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-bold text-[#17402D]/70 transition-colors hover:bg-[#DDEBE0] hover:text-[#17402D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F]"
    >
      העדפות עוגיות
    </button>
  );
}
