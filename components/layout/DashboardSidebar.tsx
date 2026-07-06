"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS: { href: string; label: string; exact?: boolean; spot?: boolean }[] = [
  { href: "/dashboard", label: "סקירה כללית", exact: true },
  { href: "/dashboard/profile", label: "עריכת פרופיל" },
  { href: "/dashboard/schedule", label: "לוח זמנים להיום" },
  { href: "/dashboard/events", label: "אירועים" },
  { href: "/dashboard/photos", label: "תמונות" },
  { href: "/dashboard/billing", label: "חיוב ומנוי" },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-full md:w-56 flex-shrink-0" aria-label="ניווט לוח הבקרה" data-tour="sidebar">
      <nav className="hidden md:block bg-[#F7F3EA] rounded-2xl border border-slate-200 overflow-hidden shadow-card">
        {NAV_ITEMS.map(({ href, label, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-inset border-r-2 ${
                active
                  ? "bg-[#EFF5F0] text-[#1F5038] border-r-[#2D6A4F]"
                  : "text-slate-600 hover:bg-[#EFF5F0] hover:text-[#1F5038] border-r-transparent hover:border-r-[#2D6A4F]"
              }`}
              aria-current={active ? "page" : undefined}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <nav className="flex md:hidden overflow-x-auto scrollbar-hide bg-[#F7F3EA] rounded-2xl border border-slate-200 shadow-card">
        {NAV_ITEMS.map(({ href, label, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 py-3 px-2 text-center text-xs font-medium whitespace-nowrap border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] ${
                active ? "text-[#2D6A4F] border-b-[#2D6A4F]" : "text-slate-600 hover:text-[#2D6A4F] border-b-transparent hover:border-b-[#2D6A4F]"
              }`}
              aria-current={active ? "page" : undefined}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
