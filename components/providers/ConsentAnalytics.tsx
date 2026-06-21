"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";

const CONSENT_KEY = "po-cookie-consent";

export default function ConsentAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    function syncConsent() {
      setEnabled(localStorage.getItem(CONSENT_KEY) === "accepted");
    }

    syncConsent();
    window.addEventListener("po-cookie-consent-accepted", syncConsent);
    window.addEventListener("po-cookie-consent-declined", syncConsent);
    return () => {
      window.removeEventListener("po-cookie-consent-accepted", syncConsent);
      window.removeEventListener("po-cookie-consent-declined", syncConsent);
    };
  }, []);

  return enabled ? <Analytics /> : null;
}
