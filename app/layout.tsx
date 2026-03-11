import type { Metadata } from "next";
import { Secular_One } from "next/font/google";
import "./globals.css";
import "@/lib/env";
import CookieConsent from "@/components/layout/CookieConsent";
import AccessibilityWidget from "@/components/layout/AccessibilityWidget";
import { Analytics } from "@vercel/analytics/next";

const secularOne = Secular_One({
  variable: "--font-secular",
  subsets: ["latin", "hebrew"],
  weight: ["400"],
  display: "swap",
});

const BASE_URL = "https://pokarov.co.il";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "פה קרוב — גלו עסקים קטנים וניידים קרוב אליכם",
    template: "%s | פה קרוב",
  },
  description:
    "פה קרוב עוזר לכם למצוא עסקים ניידים קרוב אליכם — קפה, פלאפל, מאפים, פרחים, תכשיטים ועוד. ראו בזמן אמת היכן הם נמצאים היום על המפה.",
  keywords: [
    "עסקים ניידים", "עסקים קטנים ישראל", "קפה נייד", "פלאפל נייד",
    "שוק פשפשים", "אוכל רחוב ישראל", "עסק מהבית", "po karov", "פה קרוב",
    "מפת עסקים", "עסקים בשכונה",
  ],
  authors: [{ name: "פה קרוב", url: BASE_URL }],
  creator: "פה קרוב",
  publisher: "פה קרוב",
  applicationName: "פה קרוב",
  alternates: {
    canonical: BASE_URL,
    languages: { "he-IL": BASE_URL },
  },
  openGraph: {
    type: "website",
    locale: "he_IL",
    url: BASE_URL,
    siteName: "פה קרוב",
    title: "פה קרוב — גלו עסקים קטנים וניידים קרוב אליכם",
    description:
      "גלו עסקים ניידים קרוב אליכם — ראו בזמן אמת על המפה היכן נמצאים קפה, אוכל, פרחים, תכשיטים ועוד.",
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
    title: "פה קרוב — גלו עסקים קטנים וניידים",
    description: "גלו עסקים ניידים קרוב אליכם בזמן אמת על המפה.",
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
    google: "", // הוסף Google Search Console verification token כשיהיה
  },
};

// JSON-LD — Organization schema
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "פה קרוב",
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
  name: "פה קרוב",
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
        <link rel="icon" href="/logo.png" type="image/png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className={`${secularOne.variable} antialiased font-sans`}>
        <a href="#main-content" className="skip-to-content">
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
