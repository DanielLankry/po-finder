// `app/pricing/page.tsx` is a client component, which can't export
// metadata directly. This server-side layout supplies the per-page <title>
// and description.

export const metadata = {
  title: "מחירים — פה קרוב",
  description:
    "תשלום חד פעמי לפי תקופה — ללא חיוב חוזר. בחרו כמה זמן תרצו להופיע על המפה והתחילו להשיג לקוחות.",
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
