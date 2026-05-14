// `app/pricing/page.tsx` is a client component, which can't export
// metadata directly. This server-side layout supplies the per-page <title>
// and description.

export const metadata = {
  title: "הצטרפות עסקים",
  description:
    "הצטרפו לפה קרוב והופיעו על מפה בזמן אמת עם פרופיל עסק, תמונות, שעות פעילות, מיקום וכפתור התקשרות.",
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
