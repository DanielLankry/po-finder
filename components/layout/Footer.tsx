import Link from "next/link";
import { MapPin } from "lucide-react";

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
      className="border-t border-slate-200 bg-[#FAFAF7] py-8"
      dir="rtl"
      aria-label="כותרת תחתית"
    >
      <div className="max-w-[1280px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] rounded-lg"
          aria-label="פה — דף הבית"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="פה" className="h-7 w-auto" />
        </Link>

        <nav aria-label="קישורי תחתית">
          <ul className="flex flex-wrap items-center gap-4 sm:gap-6">
            {LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-slate-500 text-sm hover:text-[#059669] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] rounded"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="text-slate-400 text-xs">
          © 2026 פה. כל הזכויות שמורות.
        </p>
      </div>
    </footer>
  );
}
