import type { Metadata } from "next";
import "./globals.css";
import "@/lib/env";
import CookieConsent from "@/components/layout/CookieConsent";
import AccessibilityWidget from "@/components/layout/AccessibilityWidget";
import { Analytics } from "@vercel/analytics/next";
import PostHogProvider from "@/components/providers/PostHogProvider";
import { BRAND_NAME, SITE_URL } from "@/lib/site-config";

const BASE_URL = SITE_URL;

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "פה קרוב | עסקים קטנים ודוכנים על מפה בזמן אמת",
    template: `%s | ${BRAND_NAME}`,
  },
  description:
    "פה קרוב עוזרת לאנשים למצוא דוכנים, עגלות קפה, עסקים ניידים ועסקים קטנים קרוב אליהם לפי מיקום, קטגוריה ושעות פעילות.",
  keywords: [
    "עסקים ניידים", "עסקים קטנים ישראל", "קפה נייד", "פלאפל נייד",
    "שוק פשפשים", "אוכל רחוב ישראל", "עסק מהבית", "po karov", "פה קרוב",
    "מפת עסקים", "עסקים בשכונה",
  ],
  authors: [{ name: BRAND_NAME, url: BASE_URL }],
  creator: BRAND_NAME,
  publisher: BRAND_NAME,
  applicationName: BRAND_NAME,
  alternates: {
    canonical: BASE_URL,
    languages: { "he-IL": BASE_URL },
  },
  openGraph: {
    type: "website",
    locale: "he_IL",
    url: BASE_URL,
    siteName: BRAND_NAME,
    title: "פה קרוב | עסקים קטנים ודוכנים על מפה בזמן אמת",
    description:
      "פה קרוב עוזרת לאנשים למצוא דוכנים, עגלות קפה, עסקים ניידים ועסקים קטנים קרוב אליהם לפי מיקום, קטגוריה ושעות פעילות.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "פה קרוב — מפת עסקים ניידים",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "פה קרוב | עסקים קטנים ודוכנים על מפה בזמן אמת",
    description: "פה קרוב עוזרת למצוא עסקים קטנים ועסקים ניידים קרוב אליכם בזמן אמת.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "0G-mIJrkD1TvdIPFDKpUnxGEt9lc2HNdEsA8lXDvjTg",
  },
};

// JSON-LD — Organization schema
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: BRAND_NAME,
  url: BASE_URL,
  logo: `${BASE_URL}/logo.png`,
  description: "פלטפורמה לגילוי עסקים קטנים וניידים בישראל",
  inLanguage: "he",
  areaServed: {
    "@type": "Country",
    name: "Israel",
  },
};

// JSON-LD — WebSite with SearchAction
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: BRAND_NAME,
  url: BASE_URL,
  inLanguage: "he",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${BASE_URL}/?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="icon" href="/logo.png" type="image/png" sizes="512x512" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="antialiased font-sans">
        <a href="#main-content" className="skip-to-content">
          דלגו לתוכן הראשי
        </a>
        <PostHogProvider>
          <main id="main-content">{children}</main>
        </PostHogProvider>
        <AccessibilityWidget />
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  );
}
