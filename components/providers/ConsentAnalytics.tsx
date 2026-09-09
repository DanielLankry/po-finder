"use client";

import { useEffect, useRef, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import type { BeforeSendMiddleware } from "@vercel/speed-insights";
import { SpeedInsights } from "@vercel/speed-insights/next";

const CONSENT_KEY = "po-cookie-consent";
const filterSpeedInsightByConsent: BeforeSendMiddleware = (event) =>
  localStorage.getItem(CONSENT_KEY) === "accepted" ? event : null;

export default function ConsentAnalytics() {
  const [enabled, setEnabled] = useState(false);
  const enabledRef = useRef(false);

  useEffect(() => {
    function syncConsent() {
      const nextEnabled = localStorage.getItem(CONSENT_KEY) === "accepted";

      if (enabledRef.current && !nextEnabled) {
        window.location.reload();
        return;
      }

      enabledRef.current = nextEnabled;
      setEnabled(nextEnabled);
    }

    syncConsent();
    window.addEventListener("po-cookie-consent-accepted", syncConsent);
    window.addEventListener("po-cookie-consent-declined", syncConsent);
    return () => {
      window.removeEventListener("po-cookie-consent-accepted", syncConsent);
      window.removeEventListener("po-cookie-consent-declined", syncConsent);
    };
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <>
      <Analytics />
      <SpeedInsights beforeSend={filterSpeedInsightByConsent} />
    </>
  );
}
