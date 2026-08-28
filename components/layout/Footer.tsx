import Link from "next/link";
import Image from "next/image";
import CookiePreferencesButton from "./CookiePreferencesButton";

const LINKS = [
  { href: "/about", label: "אודות" },
  { href: "/pricing", label: "מחירים" },
  { href: "/contact", label: "צרו קשר" },
  { href: "/terms", label: "תנאי שימוש" },
  { href: "/privacy", label: "מדיניות פרטיות" },
  { href: "/accessibility", label: "נגישות" },
];

export default function Footer() {
  return (
    <footer
      className="brand-canvas border-t-2 border-[#17402D] py-8"
      dir="rtl"
      aria-label="כותרת תחתית"
    >
      <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 px-4 sm:flex-row">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-2 rounded-xl px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F]"
          aria-label="פה קרוב — דף הבית"
        >
          <Image src="/logo.png" alt="" width={36} height={36} className="h-9 w-9" />
          <span className="brand-wordmark text-xl text-[#17402D]">פה קרוב</span>
        </Link>

        <div className="brand-rule w-full sm:hidden" aria-hidden="true" />

        <nav className="max-w-full" aria-label="קישורי תחתית">
          <ul className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 sm:gap-x-2">
            {LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-bold text-[#17402D]/70 transition-colors hover:bg-[#DDEBE0] hover:text-[#17402D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F]"
                >
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <CookiePreferencesButton />
            </li>
          </ul>
        </nav>

        <div className="brand-rule w-full sm:hidden" aria-hidden="true" />

        <p className="text-xs font-semibold text-[#17402D]/55">
          © 2026 פה קרוב. כל הזכויות שמורות.
        </p>
      </div>
    </footer>
  );
}
