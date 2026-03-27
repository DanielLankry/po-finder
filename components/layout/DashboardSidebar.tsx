"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS: { href: string; label: string; exact?: boolean; spot?: boolean }[] = [
  { href: "/dashboard", label: "סקירה כללית", exact: true },
  { href: "/dashboard/profile", label: "עריכת פרופיל" },
  { href: "/dashboard/schedule", label: "לוח זמנים להיום" },
  { href: "/dashboard/events", label: "אירועים" },
  { href: "/dashboard/photos", label: "תמונות" },
  { href: "/dashboard/spots", label: "⚡ Spots", spot: true },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-full md:w-56 flex-shrink-0" aria-label="ניווט לוח הבקרה">
      <nav className="hidden md:block bg-[#FAFAF7] rounded-2xl border border-slate-200 overflow-hidden shadow-card">
        {NAV_ITEMS.map(({ href, label, exact, spot }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-inset border-r-2 ${
                spot
                  ? active
                    ? "bg-amber-50 text-amber-700 border-r-amber-500"
                    : "text-amber-600 hover:bg-amber-50 border-r-transparent hover:border-r-amber-400"
                  : active
                  ? "bg-blue-50 text-blue-700 border-r-blue-600"
                  : "text-slate-600 hover:bg-blue-50 hover:text-blue-700 border-r-transparent hover:border-r-blue-600"
              }`}
              aria-current={active ? "page" : undefined}
            >
              {label}
              {spot && !active && (
                <span className="mr-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600">חדש</span>
              )}
            </Link>
          );
        })}
      </nav>

      <nav className="flex md:hidden overflow-x-auto scrollbar-hide bg-[#FAFAF7] rounded-2xl border border-slate-200 shadow-card">
        {NAV_ITEMS.map(({ href, label, exact, spot }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 py-3 px-2 text-center text-xs font-medium whitespace-nowrap border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                spot
                  ? active ? "text-amber-600 border-b-amber-500" : "text-amber-500 border-b-transparent hover:border-b-amber-400"
                  : active ? "text-blue-600 border-b-blue-600" : "text-slate-600 hover:text-blue-600 border-b-transparent hover:border-b-blue-600"
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
