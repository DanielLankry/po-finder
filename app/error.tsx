"use client";

import { TriangleAlert } from "lucide-react";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="brand-canvas min-h-screen flex items-center justify-center px-5 py-10" dir="rtl">
      <div className="brand-panel p-8 text-center max-w-md">
        <div className="brand-chip h-16 w-16 justify-center mx-auto mb-6">
          <TriangleAlert className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="font-display font-bold text-2xl text-stone-900 mb-2">
          משהו השתבש
        </h1>
        <p className="text-stone-500 text-sm mb-8">
          אירעה שגיאה בלתי צפויה. נסו לרענן את העמוד.
        </p>
        <button
          onClick={reset}
          className="brand-button inline-flex items-center justify-center h-11 px-6 rounded-xl font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2"
        >
          נסו שוב
        </button>
      </div>
    </div>
  );
}
