"use client";

import { useEffect } from "react";

/** Completion links target fields after asynchronous owner data has rendered. */
export function useOwnerFormAnchor(loading: boolean) {
  useEffect(() => {
    if (loading) return;
    const focusAnchor = () => {
      const id = window.location.hash.slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      target?.scrollIntoView({ block: "center" });
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) target.focus({ preventScroll: true });
    };
    focusAnchor();
    window.addEventListener("hashchange", focusAnchor);
    return () => window.removeEventListener("hashchange", focusAnchor);
  }, [loading]);
}
