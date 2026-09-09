import type { Metadata } from "next";
import { ConfirmEmailForm } from "@/components/auth/ConfirmEmailForm";

// Native same-origin form POSTs need their Origin header for the callback's CSRF check.
// Tokens are removed from the fragment before submission and never enter the referrer.
export const metadata: Metadata = { title: "אימות המייל", robots: { index: false, follow: false }, referrer: "same-origin" };

/** A deliberate POST keeps email link scanners from consuming the one-use confirmation. */
export default function ConfirmEmailPage() {
  return <ConfirmEmailForm />;
}
