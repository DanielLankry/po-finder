"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  disableMetaPixel,
  initMetaPixel,
  trackMetaEvent,
  trackMetaPageView,
} from "@/lib/meta-pixel";
import { trackPostHogEvent } from "@/lib/posthog";

/** Synchronizes Meta Pixel with consent changes and App Router navigation. */
function MetaPixelTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    function onConsent() {
      initMetaPixel();
      trackMetaPageView();
    }

    initMetaPixel();
    window.addEventListener("po-cookie-consent-accepted", onConsent);
    window.addEventListener("po-cookie-consent-declined", disableMetaPixel);
    return () => {
      window.removeEventListener("po-cookie-consent-accepted", onConsent);
      window.removeEventListener("po-cookie-consent-declined", disableMetaPixel);
    };
  }, []);

  useEffect(() => {
    if (pathname) trackMetaPageView();
  }, [pathname, searchParams]);

  useEffect(() => {
    const registrationRole = searchParams.get("registration");
    if (
      registrationRole !== "business_owner" &&
      registrationRole !== "customer"
    ) {
      return;
    }

    const metaStorageKey = `po-meta-complete-registration:${registrationRole}`;
    const postHogStorageKey = `po-posthog-complete-registration:${registrationRole}`;
    function sendRegistration() {
      if (
        !sessionStorage.getItem(metaStorageKey) &&
        trackMetaEvent("CompleteRegistration", {
          content_name: `${registrationRole}_account`,
          status: true,
        })
      ) {
        sessionStorage.setItem(metaStorageKey, "1");
      }
      if (
        !sessionStorage.getItem(postHogStorageKey) &&
        trackPostHogEvent("registration_completed", {
          role: registrationRole,
        })
      ) {
        sessionStorage.setItem(postHogStorageKey, "1");
      }
    }

    sendRegistration();
    window.addEventListener("po-cookie-consent-accepted", sendRegistration);
    return () =>
      window.removeEventListener("po-cookie-consent-accepted", sendRegistration);
  }, [searchParams]);

  return null;
}

/** Mounts the consent-aware Meta Pixel tracker without blocking page rendering. */
export default function MetaPixelProvider() {
  return (
    <Suspense fallback={null}>
      <MetaPixelTracker />
    </Suspense>
  );
}
