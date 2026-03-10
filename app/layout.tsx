import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import "@/lib/env";
import CookieConsent from "@/components/layout/CookieConsent";
import AccessibilityWidget from "@/components/layout/AccessibilityWidget";
import { Analytics } from "@vercel/analytics/next";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["latin", "hebrew"],
  weight: ["400", "500", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "פה — גלו עסקים קטנים קרובים אליכם",
  description:
    "גלו את העסקים הקטנים הכי קרובים אליכם — קפה, פלאפל, פיצה, מאפים ועוד. פה עוזר לכם למצוא עסקים ניידים על המפה בזמן אמת.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.variable} antialiased font-sans`}>
        <a
          href="#main-content"
          className="skip-to-content"
        >
          דלגו לתוכן הראשי
        </a>
        <main id="main-content">{children}</main>
        <AccessibilityWidget />
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  );
}
