"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "סקירה כללית", exact: true },
  { href: "/dashboard/profile", label: "עריכת פרופיל" },
  { href: "/dashboard/schedule", label: "לוח זמנים להיום" },
  { href: "/dashboard/photos", label: "תמונות" },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-full md:w-56 flex-shrink-0" aria-label="ניווט לוח הבקרה">
      <nav className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-card">
        {NAV_ITEMS.map(({ href, label, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-inset border-r-2 ${
                active
                  ? "bg-blue-50 text-blue-700 border-r-blue-600"
                  : "text-slate-600 hover:bg-blue-50 hover:text-blue-700 border-r-transparent hover:border-r-blue-600"
              }`}
              aria-current={active ? "page" : undefined}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <nav className="flex md:hidden overflow-x-auto scrollbar-hide bg-white rounded-2xl border border-slate-200 shadow-card">
        {NAV_ITEMS.map(({ href, label, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 py-3 px-2 text-center text-xs font-medium whitespace-nowrap border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                active
                  ? "text-blue-600 border-b-blue-600"
                  : "text-slate-600 hover:text-blue-600 border-b-transparent hover:border-b-blue-600"
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
