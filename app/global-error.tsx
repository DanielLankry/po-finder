"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";
import "./globals.css";

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
        <main className="brand-canvas min-h-screen flex items-center justify-center px-5 py-10 text-center">
          <div className="brand-panel max-w-md p-8">
            <h1 className="text-2xl font-extrabold text-stone-900 mb-3">משהו השתבש</h1>
            <p className="text-stone-600 mb-6">
              אירעה תקלה בטעינת העמוד. אפשר לנסות שוב או לחזור לעמוד הבית.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={reset}
                className="brand-button h-11 px-5 rounded-xl font-bold"
              >
                נסו שוב
              </button>
              <Link
                href="/"
                className="brand-control h-11 px-5 rounded-xl text-ink font-semibold flex items-center justify-center hover:bg-stone-50"
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
