"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Store, Tag, BarChart3, LogOut, Ticket } from "lucide-react";

const NAV = [
  { href: "/admin", label: "ראשי", icon: LayoutDashboard },
  { href: "/admin/businesses", label: "עסקים", icon: Store },
  { href: "/admin/pricing", label: "מחירון", icon: Tag },
  { href: "/admin/coupons", label: "קופונים", icon: Ticket },
  { href: "/admin/stats", label: "סטטיסטיקות", icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Login page: no sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    window.location.href = "/admin/login";
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex" dir="rtl">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-l border-[#E5E7EB] flex flex-col shadow-sm">
        {/* Logo */}
        <div className="p-6 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#ECFDF5] flex items-center justify-center">
              <svg width="20" height="25" viewBox="0 0 40 50" fill="none"><defs><linearGradient id="gl" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#34d399"/><stop offset="100%" stopColor="#059669"/></linearGradient></defs><path d="M20 0C9.507 0 1 8.507 1 19c0 13.255 17.5 29.5 18.25 30.188a1.125 1.125 0 0 0 1.5 0C21.5 48.5 39 32.255 39 19 39 8.507 30.493 0 20 0z" fill="url(#gl)"/><text x="20" y="26" textAnchor="middle" fontFamily="sans-serif" fontWeight="800" fontSize="20" fill="white">פ</text></svg>
            </div>
            <div>
              <p className="font-bold text-[#111] text-sm">פוקרוב</p>
              <p className="text-[#888] text-xs">לוח ניהול</p>
            </div>
          </div>
        </div>
        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#ECFDF5] text-[#059669]"
                    : "text-[#555] hover:bg-[#ECFDF5] hover:text-[#059669]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        {/* Logout */}
        <div className="p-4 border-t border-[#E5E7EB]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors text-sm font-medium w-full"
          >
            <LogOut className="h-4 w-4" />
            יציאה
          </button>
        </div>
      </aside>
      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
