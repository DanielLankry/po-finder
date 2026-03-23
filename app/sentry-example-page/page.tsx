"use client";
import * as Sentry from "@sentry/nextjs";

export default function SentryExamplePage() {
  return (
    <div style={{ padding: 40 }}>
      <h1>Sentry Test</h1>
      <button
        onClick={() => {
          throw new Error("Sentry test error from pokarov.co.il");
        }}
      >
        Trigger Test Error
      </button>
    </div>
  );
}
