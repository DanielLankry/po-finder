"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initPostHog, posthog } from "@/lib/posthog";

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname;
      if (searchParams?.toString()) url += `?${searchParams.toString()}`;
      posthog.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams]);

  return null;
}

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only init PostHog after explicit cookie consent (Amendment 13 compliance)
    if (localStorage.getItem("po-cookie-consent") === "accepted") {
      initPostHog();
    }

    function onConsent() {
      initPostHog();
    }
    window.addEventListener("po-cookie-consent-accepted", onConsent);
    return () => window.removeEventListener("po-cookie-consent-accepted", onConsent);
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </>
  );
}
