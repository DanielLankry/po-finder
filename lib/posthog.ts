import posthog from "posthog-js";

let initialized = false;
let enabled = false;
const CONSENT_KEY = "po-cookie-consent";

export function initPostHog() {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

  if (!initialized) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: false, // we capture manually for SPA
      capture_pageleave: true,
      loaded: (ph) => {
        if (process.env.NODE_ENV === "development") ph.debug();
      },
    });
    initialized = true;
  }

  posthog.opt_in_capturing();
  enabled = true;
}

export function disablePostHog() {
  enabled = false;
  if (initialized) posthog.opt_out_capturing();
}

export function isPostHogEnabled() {
  return enabled;
}

export function trackPostHogEvent(
  event: string,
  properties?: Record<string, unknown>,
): boolean {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem(CONSENT_KEY) !== "accepted") return false;

  initPostHog();
  if (!enabled) return false;

  posthog.capture(event, properties);
  return true;
}

export { posthog };
