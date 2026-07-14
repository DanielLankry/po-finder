"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, CalendarRange, CreditCard, Images, LayoutDashboard, Store } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "סקירה כללית", exact: true, icon: LayoutDashboard },
  { href: "/dashboard/profile", label: "עריכת פרופיל", icon: Store },
  { href: "/dashboard/schedule", label: "לוח זמנים להיום", icon: CalendarDays },
  { href: "/dashboard/events", label: "אירועים", icon: CalendarRange },
  { href: "/dashboard/photos", label: "תמונות", icon: Images },
  { href: "/dashboard/billing", label: "חיוב ומנוי", icon: CreditCard },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-full md:w-56 flex-shrink-0" aria-label="ניווט לוח הבקרה" data-tour="sidebar">
      <nav className="brand-panel hidden md:block overflow-hidden bg-[#FFFDF7]">
        <div className="border-b-2 border-[#17402D] bg-[#FFF3B0] px-5 py-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8A3618]">פה קרוב לעסקים</p>
          <p className="font-display text-2xl leading-none text-[#17402D]">מרכז העסק</p>
        </div>
        {NAV_ITEMS.map(({ href, label, exact, icon: Icon }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-5 py-3.5 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-inset border-r-4 ${
                active
                  ? "bg-[#F6E3D9] text-[#8A3618] border-r-[#C4552D]"
                  : "text-stone-600 hover:bg-[#EFF5F0] hover:text-[#1F5038] border-r-transparent hover:border-r-[#2D6A4F]"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      <nav className="brand-panel-soft flex md:hidden overflow-x-auto scrollbar-hide bg-[#FFFDF7]">
        {NAV_ITEMS.map(({ href, label, exact, icon: Icon }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-[88px] flex-1 flex-col items-center gap-1 py-2.5 px-2 text-center text-[11px] font-bold whitespace-nowrap border-b-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] ${
                active ? "bg-[#F6E3D9] text-[#8A3618] border-b-[#C4552D]" : "text-stone-600 hover:text-[#2D6A4F] border-b-transparent hover:border-b-[#2D6A4F]"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
