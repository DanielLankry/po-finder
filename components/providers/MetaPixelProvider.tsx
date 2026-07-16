"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  disableMetaPixel,
  initMetaPixel,
  trackMetaPageView,
} from "@/lib/meta-pixel";

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
