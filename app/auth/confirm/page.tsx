import type { Metadata } from "next";
import { ConfirmEmailForm } from "@/components/auth/ConfirmEmailForm";

export const metadata: Metadata = { title: "אימות המייל", robots: { index: false, follow: false }, referrer: "no-referrer" };

/** A deliberate POST keeps email link scanners from consuming the one-use confirmation. */
export default function ConfirmEmailPage() {
  return <ConfirmEmailForm />;
}
