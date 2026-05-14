"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="he" dir="rtl">
      <body>
        <main className="min-h-screen bg-[#FAFAF7] flex items-center justify-center px-4 text-center">
          <div className="max-w-md rounded-3xl bg-white border border-stone-200 p-8 shadow-sm">
            <h1 className="text-2xl font-extrabold text-stone-900 mb-3">משהו השתבש</h1>
            <p className="text-stone-600 mb-6">
              אירעה תקלה בטעינת העמוד. אפשר לנסות שוב או לחזור לעמוד הבית.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={reset}
                className="h-11 px-5 rounded-full bg-[#059669] text-white font-semibold hover:bg-[#047857]"
              >
                נסו שוב
              </button>
              <Link
                href="/"
                className="h-11 px-5 rounded-full border border-stone-200 text-stone-700 font-semibold flex items-center justify-center hover:bg-stone-50"
              >
                חזרה לעמוד הבית
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
