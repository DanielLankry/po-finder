"use client";

const CONSENT_KEY = "po-cookie-consent";
const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "27527545196939763";
const META_PIXEL_SCRIPT_ID = "meta-pixel-script";

type MetaPixelFunction = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  loaded: boolean;
  push: MetaPixelFunction;
  queue: unknown[][];
  version: string;
};

declare global {
  interface Window {
    _fbq?: MetaPixelFunction;
    fbq?: MetaPixelFunction;
  }
}

let initialized = false;
let enabled = false;

export type MetaStandardEvent =
  | "CompleteRegistration"
  | "InitiateCheckout"
  | "Lead"
  | "Purchase"
  | "ViewContent";

/** Creates Meta's command queue and loads the Pixel library asynchronously. */
function loadMetaPixelLibrary(): MetaPixelFunction {
  if (window.fbq) return window.fbq;

  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) {
      fbq.callMethod(...args);
    } else {
      fbq.queue.push(args);
    }
  } as MetaPixelFunction;

  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  window.fbq = fbq;
  window._fbq = fbq;

  if (!document.getElementById(META_PIXEL_SCRIPT_ID)) {
    const script = document.createElement("script");
    script.id = META_PIXEL_SCRIPT_ID;
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }

  return fbq;
}

/** Enables Meta Pixel only after the visitor has accepted optional cookies. */
export function initMetaPixel() {
  if (
    typeof window === "undefined" ||
    localStorage.getItem(CONSENT_KEY) !== "accepted"
  ) {
    return;
  }

  const fbq = loadMetaPixelLibrary();
  fbq("consent", "grant");
  if (!initialized) {
    fbq("init", META_PIXEL_ID);
    initialized = true;
  }
  enabled = true;
}

/** Records one page view while optional-cookie consent remains active. */
export function trackMetaPageView() {
  if (
    enabled &&
    typeof window !== "undefined" &&
    localStorage.getItem(CONSENT_KEY) === "accepted"
  ) {
    window.fbq?.("track", "PageView");
  }
}

/** Sends a consent-aware standard Meta event and reports whether it was queued. */
export function trackMetaEvent(
  eventName: MetaStandardEvent,
  parameters: Record<string, unknown> = {},
  options?: { eventID?: string }
): boolean {
  if (
    !enabled ||
    typeof window === "undefined" ||
    localStorage.getItem(CONSENT_KEY) !== "accepted" ||
    !window.fbq
  ) {
    return false;
  }

  if (options) {
    window.fbq("track", eventName, parameters, options);
  } else {
    window.fbq("track", eventName, parameters);
  }
  return true;
}

/** Revokes Meta tracking and removes accessible first-party Meta cookies. */
export function disableMetaPixel() {
  enabled = false;
  if (typeof window === "undefined") return;

  window.fbq?.("consent", "revoke");
  for (const cookieName of ["_fbp", "_fbc"]) {
    document.cookie = `${cookieName}=; Max-Age=0; path=/; SameSite=Lax`;
    document.cookie = `${cookieName}=; Max-Age=0; path=/; domain=${window.location.hostname}; SameSite=Lax`;
  }
}
