"use client";

import { usePathname } from "next/navigation";
import PostHogProvider from "./PostHogProvider";
import ConsentAnalytics from "./ConsentAnalytics";
import MetaPixelProvider from "./MetaPixelProvider";

/** Confirmation URLs carry a one-use credential, so analytics must never mount there. */
export function TrackingBoundary({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/auth/confirm") return <>{children}</>;
  return (
    <PostHogProvider>
      {children}
      <ConsentAnalytics />
      <MetaPixelProvider />
    </PostHogProvider>
  );
}
