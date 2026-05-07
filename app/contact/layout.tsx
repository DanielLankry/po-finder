// `app/contact/page.tsx` is a client component, which can't export
// metadata directly. This server-side layout supplies the per-page <title>
// and description so search engines and the browser tab show the right text.

export const metadata = {
  title: "צרו קשר — פה קרוב",
  description:
    "צרו קשר עם פוקרוב — שאלות כלליות, הוספת עסק למפה, דיווח על תקלה, פרטיות, חיוב ותשלומים.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
