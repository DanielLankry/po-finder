"use client";

import { useEffect, useRef, useState } from "react";
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
  // Write active:false rather than removing the key entirely.
  // This prevents the effect from re-starting the tour when shouldRun is still
  // true from the server but localStorage was already cleared.
  writeState({ active: false, stepIndex: -1 });
  try {
    await fetch("/api/onboarding/complete", { method: "POST" });
  } catch {
    // non-fatal
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
  const [isActive, setIsActive] = useState(false);

  function handleSkip() {
    driverRef.current?.destroy();
    void markComplete();
    setIsActive(false);
  }

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = readState();
    let state: TourState | null = stored;

    if (!state) {
      if (!shouldRun) return;
      state = { active: true, stepIndex: 0 };
      writeState(state);
    }
    // If the stored state explicitly marks the tour inactive, stop here.
    if (!state.active) return;

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const currentStep = state.stepIndex;
    const step = TOUR_STEPS[currentStep];
    if (!step) {
      void markComplete();
      return;
    }
    if (step.route !== pathname) {
      router.push(step.route);
      return;
    }

    let cancelled = false;

    (async () => {
      if (step.selector) {
        await waitForSelector(step.selector);
      }
      if (cancelled) return;

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

          if (nextGlobal >= TOUR_STEPS.length) {
            d.destroy();
            void markComplete();
            return;
          }

          const nextStep = TOUR_STEPS[nextGlobal];
          writeState({ active: true, stepIndex: nextGlobal });

          if (nextStep.route !== pathname) {
            d.destroy();
            router.push(nextStep.route);
            return;
          }

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
          setIsActive(false);
        },
      });

      driverRef.current = d;
      setIsActive(true);
      d.drive(Math.max(0, indexInDriver));
    })();

    return () => {
      cancelled = true;
      driverRef.current?.destroy();
      driverRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!isActive) return null;

  return (
    <button
      onClick={handleSkip}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999] bg-white/90 backdrop-blur-sm border border-stone-200 text-stone-500 text-sm font-medium px-4 py-2 rounded-full shadow-md hover:bg-stone-50 hover:text-stone-700 transition-colors"
      aria-label="דלג על הסיור"
    >
      דלג על הסיור ✕
    </button>
  );
}
