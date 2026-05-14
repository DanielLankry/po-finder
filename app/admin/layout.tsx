"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Store, Tag, BarChart3, LogOut, Ticket, Menu, X, CreditCard } from "lucide-react";

const NAV = [
  { href: "/admin", label: "ראשי", icon: LayoutDashboard },
  { href: "/admin/businesses", label: "עסקים", icon: Store },
  { href: "/admin/payments", label: "תשלומים", icon: CreditCard },
  { href: "/admin/pricing", label: "מחירון", icon: Tag },
  { href: "/admin/coupons", label: "קופונים", icon: Ticket },
  { href: "/admin/stats", label: "סטטיסטיקות", icon: BarChart3 },
];

const LOGO = (
  <svg width="20" height="25" viewBox="0 0 40 50" fill="none">
    <defs><linearGradient id="gl" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#34d399"/><stop offset="100%" stopColor="#059669"/>
    </linearGradient></defs>
    <path d="M20 0C9.507 0 1 8.507 1 19c0 13.255 17.5 29.5 18.25 30.188a1.125 1.125 0 0 0 1.5 0C21.5 48.5 39 32.255 39 19 39 8.507 30.493 0 20 0z" fill="url(#gl)"/>
    <text x="20" y="26" textAnchor="middle" fontFamily="sans-serif" fontWeight="800" fontSize="20" fill="white">פ</text>
  </svg>
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (pathname === "/admin/login") return <>{children}</>;

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    window.location.href = "/admin/login";
  }

  const navLinks = (
    <nav className="flex-1 p-4 space-y-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              active
                ? "bg-[#ECFDF5] text-[#059669] font-semibold"
                : "text-[#555] hover:bg-[#ECFDF5] hover:text-[#059669]"
            }`}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#F3F4F6]" dir="rtl">
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-50 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-4 h-14 shadow-sm">
        <div className="flex items-center gap-2">
          {LOGO}
          <span className="font-bold text-[#111] text-sm">פה קרוב — ניהול</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-[#F3F4F6] transition-colors">
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 right-0 h-full w-60 bg-white border-l border-[#E5E7EB] flex flex-col shadow-sm z-50
        transition-transform duration-300
        md:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}
      `}>
        {/* Logo — desktop */}
        <div className="hidden md:flex p-6 border-b border-[#E5E7EB] items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#ECFDF5] flex items-center justify-center">
            {LOGO}
          </div>
          <div>
            <p className="font-bold text-[#111] text-sm">פה קרוב</p>
            <p className="text-[#888] text-xs">לוח ניהול</p>
          </div>
        </div>

        {/* Logo — mobile (with close) */}
        <div className="md:hidden flex items-center justify-between p-4 pt-5 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-[#ECFDF5] flex items-center justify-center">{LOGO}</div>
            <p className="font-bold text-[#111] text-sm">ניהול</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {navLinks}

        {/* Logout */}
        <div className="p-4 border-t border-[#E5E7EB]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors text-sm font-medium"
          >
            <LogOut className="h-4 w-4" />
            יציאה
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="md:mr-60 pt-14 md:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}
