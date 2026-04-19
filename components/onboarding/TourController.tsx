"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { TOUR_STEPS, routeForStep } from "./steps";

const STATE_KEY = "pofkarov.tour.state";

interface TourState {
  active: boolean;
  stepIndex: number;
}

function readState(): TourState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STATE_KEY);
    return raw ? (JSON.parse(raw) as TourState) : null;
  } catch {
    return null;
  }
}

function writeState(state: TourState | null) {
  if (typeof window === "undefined") return;
  try {
    if (state) window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
    else window.localStorage.removeItem(STATE_KEY);
  } catch {
    // ignore — tour just restarts next visit
  }
}

/** Poll the DOM up to `timeoutMs` waiting for `selector` to appear. */
function waitForSelector(selector: string, timeoutMs = 2000): Promise<Element | null> {
  return new Promise((resolve) => {
    const immediate = document.querySelector(selector);
    if (immediate) return resolve(immediate);

    const start = Date.now();
    const id = window.setInterval(() => {
      const el = document.querySelector(selector);
      if (el) {
        window.clearInterval(id);
        resolve(el);
      } else if (Date.now() - start > timeoutMs) {
        window.clearInterval(id);
        resolve(null);
      }
    }, 80);
  });
}

async function markComplete() {
  writeState(null);
  try {
    await fetch("/api/onboarding/complete", { method: "POST" });
  } catch {
    // non-fatal — we already cleared localStorage so tour won't re-loop
  }
}

interface TourControllerProps {
  /** Whether the logged-in user still needs to see the tour. */
  shouldRun: boolean;
}

export default function TourController({ shouldRun }: TourControllerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const driverRef = useRef<Driver | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Decide whether the tour should be active on this mount.
    const stored = readState();
    let state: TourState | null = stored;

    if (!state) {
      if (!shouldRun) return; // already completed, no stored progress — nothing to do
      state = { active: true, stepIndex: 0 };
      writeState(state);
    }
    if (!state.active) return;

    // Respect prefers-reduced-motion
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Find a step on this route to anchor. If none, push to the step's route.
    const currentStep = state.stepIndex;
    const step = TOUR_STEPS[currentStep];
    if (!step) {
      // Past the last step — mark complete.
      void markComplete();
      return;
    }
    if (step.route !== pathname) {
      router.push(step.route);
      return;
    }

    let cancelled = false;

    (async () => {
      // If the step has a selector, wait for it. Otherwise fire as centered.
      let resolvedSteps = TOUR_STEPS.map((s) => ({
        ...s,
        element: s.selector,
      }));

      if (step.selector) {
        await waitForSelector(step.selector);
      }
      if (cancelled) return;

      // Build a driver.js step array for this route only, so Next/Prev within the
      // driver instance never crosses routes. Cross-route moves happen via our
      // onNextClick handler that writes state + router.push.
      const sameRouteSteps = TOUR_STEPS.map((s, i) => ({
        index: i,
        step: s,
      })).filter(({ step: s }) => s.route === pathname);

      const indexInDriver = sameRouteSteps.findIndex(
        ({ index }) => index === currentStep,
      );

      const d = driver({
        showProgress: true,
        progressText: "{{current}} / {{total}}",
        nextBtnText: "הבא",
        prevBtnText: "הקודם",
        doneBtnText: "סיום",
        animate: !reduced,
        allowClose: true,
        overlayOpacity: 0.55,
        steps: sameRouteSteps.map(({ step: s }) => ({
          element: s.selector,
          popover: s.popover,
        })),
        onNextClick: () => {
          const current = d.getActiveIndex() ?? 0;
          const globalIndex = sameRouteSteps[current]?.index ?? currentStep;
          const nextGlobal = globalIndex + 1;

          // Past the last global step → finish.
          if (nextGlobal >= TOUR_STEPS.length) {
            d.destroy();
            void markComplete();
            return;
          }

          const nextStep = TOUR_STEPS[nextGlobal];
          writeState({ active: true, stepIndex: nextGlobal });

          if (nextStep.route !== pathname) {
            // Cross-route move — tear down & navigate, the next mount picks up from state.
            d.destroy();
            router.push(nextStep.route);
            return;
          }

          // Same-route advance — let driver.js move forward.
          d.moveNext();
        },
        onPrevClick: () => {
          const current = d.getActiveIndex() ?? 0;
          const globalIndex = sameRouteSteps[current]?.index ?? currentStep;
          const prevGlobal = globalIndex - 1;
          if (prevGlobal < 0) return;

          const prevStep = TOUR_STEPS[prevGlobal];
          writeState({ active: true, stepIndex: prevGlobal });

          if (prevStep.route !== pathname) {
            d.destroy();
            router.push(prevStep.route);
            return;
          }
          d.movePrevious();
        },
        onCloseClick: () => {
          d.destroy();
          void markComplete();
        },
        onDestroyed: () => {
          driverRef.current = null;
        },
      });

      driverRef.current = d;
      d.drive(Math.max(0, indexInDriver));
    })();

    return () => {
      cancelled = true;
      driverRef.current?.destroy();
      driverRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
