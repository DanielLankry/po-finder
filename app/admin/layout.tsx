"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, Store, Tag, BarChart3, LogOut, Ticket, Menu, X, CreditCard, Users, MessagesSquare } from "lucide-react";

const NAV = [
  { href: "/admin", label: "ראשי", icon: LayoutDashboard },
  { href: "/admin/businesses", label: "עסקים", icon: Store },
  { href: "/admin/users", label: "משתמשים", icon: Users },
  { href: "/admin/content", label: "תוכן", icon: MessagesSquare },
  { href: "/admin/payments", label: "תשלומים", icon: CreditCard },
  { href: "/admin/pricing", label: "מחירון", icon: Tag },
  { href: "/admin/coupons", label: "קופונים", icon: Ticket },
  { href: "/admin/stats", label: "סטטיסטיקות", icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login" || !sidebarOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSidebarOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [pathname, sidebarOpen]);

  if (pathname === "/admin/login") return <>{children}</>;

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    window.location.href = "/admin/login";
  }

  const navLinks = (
    <nav className="flex-1 p-4 space-y-2" aria-label="ניווט ניהול">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setSidebarOpen(false)}
            className={`flex min-h-11 items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] ${
              active
                ? "border-[#8A3618] bg-[#F6E3D9] text-[#8A3618] shadow-[2px_2px_0_0_#8A3618]"
                : "border-transparent text-stone-600 hover:border-[#17402D]/25 hover:bg-[#EFF5F0] hover:text-[#17402D]"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="brand-canvas min-h-[100dvh]" dir="rtl">
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-50 bg-[#F7F3EA]/95 border-b-2 border-[#17402D] flex items-center justify-between px-4 h-16 shadow-[0_3px_0_0_rgba(23,64,45,0.12)] backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="" width={40} height={40} className="h-10 w-10 rounded-xl" />
          <span className="font-bold text-[#17402D] text-sm">פה קרוב — ניהול</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="h-11 w-11 flex items-center justify-center rounded-xl hover:bg-[#EFF5F0] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F]"
          aria-label={sidebarOpen ? "סגירת תפריט ניהול" : "פתיחת תפריט ניהול"}
          aria-expanded={sidebarOpen}
          aria-controls="admin-sidebar"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      {/* Sidebar */}
      <aside
        id="admin-sidebar"
        className={`
        fixed top-0 right-0 h-[100dvh] w-[min(18rem,calc(100vw-2rem))] bg-[#FFFDF7] border-l-2 border-[#17402D] flex flex-col shadow-[6px_0_0_0_rgba(23,64,45,0.12)] z-50
        transition-transform duration-300
        md:translate-x-0
        ${sidebarOpen ? "visible translate-x-0" : "invisible translate-x-full pointer-events-none md:visible md:translate-x-0 md:pointer-events-auto"}
      `}
        role={sidebarOpen ? "dialog" : undefined}
        aria-modal={sidebarOpen ? "true" : undefined}
        aria-label="תפריט ניהול"
      >
        {/* Logo — desktop */}
        <div className="hidden md:flex p-6 border-b-2 border-[#17402D] bg-[#FFF3B0] items-center gap-3">
          <Image src="/logo.png" alt="" width={44} height={44} className="h-11 w-11 rounded-xl" />
          <div>
            <p className="font-display text-xl text-[#17402D]">פה קרוב</p>
            <p className="text-[#8A3618] font-bold text-xs">לוח ניהול</p>
          </div>
        </div>

        {/* Logo — mobile (with close) */}
        <div className="md:hidden flex items-center justify-between p-4 pt-[max(1.25rem,env(safe-area-inset-top))] border-b-2 border-[#17402D] bg-[#FFF3B0]">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="" width={40} height={40} className="h-10 w-10 rounded-xl" />
            <p className="font-bold text-[#17402D] text-sm">ניהול</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="h-11 w-11 flex items-center justify-center rounded-xl hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F]" aria-label="סגירת תפריט ניהול">
            <X className="h-4 w-4" />
          </button>
        </div>

        {navLinks}

        {/* Logout */}
        <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t-2 border-[#17402D]/20">
          <button
            onClick={handleLogout}
            className="w-full min-h-11 flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <LogOut className="h-4 w-4" />
            יציאה
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="md:mr-72 pt-16 md:pt-0 min-h-[100dvh]">
        {children}
      </main>
    </div>
  );
}
