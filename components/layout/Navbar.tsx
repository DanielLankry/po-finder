"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BadgeDollarSign,
  Heart,
  Info,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Plus,
  Search,
  Store,
  X,
} from "lucide-react";
import { Typewriter } from "@/components/ui/typewriter";
import { MagneticButton } from "@/components/ui/magnetic-button";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import PlacesSearchBar, { type LocationResult } from "@/components/map/PlacesSearchBar";

interface NavbarProps {
  onLocationSelect?: (loc: LocationResult) => void;
  favCount?: number;
  onFavoritesOpen?: () => void;
}

export default function Navbar({ onLocationSelect, favCount = 0, onFavoritesOpen }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [siteSearch, setSiteSearch] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [hasDashboardAccess, setHasDashboardAccess] = useState<boolean | null>(null);
  const supabase = useMemo(() => createClient(), []);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const isDashboardRoute = pathname?.startsWith("/dashboard") ?? false;
  const showDashboardCta = authChecked && !!user && (isDashboardRoute || hasDashboardAccess !== false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setUser(data.user);
      setAuthChecked(true);
    }).catch(() => {
      if (!cancelled) setAuthChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthChecked(true);
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  // Ask the server for the same dashboard-access decision used by the paywall.
  // This avoids client-side RLS/timing gaps after returning from HYP payment.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) {
        if (!cancelled) setHasDashboardAccess(null);
        return;
      }

      if (isDashboardRoute) {
        setHasDashboardAccess(true);
      } else {
        setHasDashboardAccess(null);
      }

      try {
        const response = await fetch("/api/account/status", {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!response.ok) {
          if (!cancelled) setHasDashboardAccess(isDashboardRoute);
          return;
        }
        const data = await response.json() as { dashboardAccess?: boolean };
        if (!cancelled) setHasDashboardAccess(Boolean(data.dashboardAccess));
      } catch {
        if (!cancelled) setHasDashboardAccess(isDashboardRoute);
      }
    })();
    return () => { cancelled = true; };
  }, [user, isDashboardRoute, pathname]);

  useEffect(() => {
    function closeUserMenu(event: MouseEvent) {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", closeUserMenu);
    return () => document.removeEventListener("mousedown", closeUserMenu);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen && !mobileSearchOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOverlay(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setMobileMenuOpen(false);
      setMobileSearchOpen(false);
    }

    window.addEventListener("keydown", closeOverlay);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOverlay);
    };
  }, [mobileMenuOpen, mobileSearchOpen]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  /** Sends navbar searches back to the map while preserving a shareable query. */
  function submitSiteSearch(event: React.FormEvent) {
    event.preventDefault();
    const query = siteSearch.trim();
    router.push(query ? `/?q=${encodeURIComponent(query)}` : "/");
    setMobileSearchOpen(false);
  }

  return (
    <header
      className={`fixed top-0 inset-x-0 ${mobileMenuOpen || mobileSearchOpen ? "z-[70]" : "z-50"} h-[72px] flex items-center transition-all duration-300 bg-[#F7F3EA] border-b-2 ${
        scrolled
          ? "shadow-[0_4px_0_0_rgba(23,64,45,0.08)] border-[#17402D]/25"
          : "border-[#17402D]/10"
      }`}
    >
      <nav
        className="w-full px-3 sm:px-5 flex items-center gap-2 sm:gap-4"
        aria-label="ניווט ראשי"
        dir="rtl"
      >
        {/* Logo + tagline — RIGHT in RTL (start) */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            href="/"
            className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] rounded-lg"
            aria-label="פה קרוב — דף הבית"
          >
            <Image src="/logo.png" alt="פה קרוב" width={52} height={52} className="rounded-xl w-10 h-10 sm:w-[52px] sm:h-[52px]" />
          </Link>
          {/* Typewriter tagline */}
          <div className="hidden min-[560px]:flex items-center border-r border-[#E5E7EB] pr-3 overflow-hidden w-[130px] sm:w-[175px] md:w-[295px]">
            <Typewriter
              text={[
                "לעסקים קטנים",
                "לדוכנים",
                "לעגלות קפה",
                "ליוצרים",
                "לשווקים ניידים",
                "לבעלי קיוסקים",
                "לאופים ביתיים",
                "למוכרי פרחים",
                "לסוחרי וינטג׳",
                "לקייטרינג",
                "לחקלאים",
                "לישראלים",
              ]}
              speed={60}
              deleteSpeed={35}
              waitTime={2200}
              className="font-display text-[#2D6A4F] font-bold text-[20px] sm:text-[24px] md:text-[30px] whitespace-nowrap"
              wordColors={{ "לישראלים": "text-[#C4552D]" }}
            />
          </div>
        </div>

        {/* Search bar — uses the available top-bar width on tablet and desktop */}
        <div className="hidden md:flex flex-1 min-w-0 justify-center max-w-[720px] min-[1440px]:max-w-[420px] mx-0 min-[1440px]:mx-auto">
          {onLocationSelect ? (
            <div className="w-full">
               <PlacesSearchBar onLocationSelect={onLocationSelect} />
            </div>
          ) : (
            <button
               onClick={() => setMobileSearchOpen(true)}
               className="flex items-center w-full h-12 rounded-full border-2 border-[#17402D]/15 bg-white shadow-[2px_2px_0_0_rgba(23,64,45,0.15)] hover:border-[#17402D] hover:shadow-[3px_3px_0_0_#17402D] hover:-translate-y-0.5 transition-all duration-200 px-2 group"
               aria-label="חיפוש עיר או שכונה"
             >
                <div className="flex-1 flex items-center justify-between px-4 text-sm">
                   <span className="font-bold text-[#222222]">בכל מקום</span>
                   <span className="w-[1px] h-6 bg-black/10 mx-3"></span>
                   <span className="text-[#717171] truncate font-medium">כל קטגוריה</span>
                </div>
               <div className="flex-shrink-0 h-9 w-9 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center mr-1 group-hover:scale-105 transition-transform duration-300 shadow-md">
                 <Search className="h-[18px] w-[18px]" aria-hidden="true" />
               </div>
            </button>
          )}
        </div>

        {/* Nav links — desktop only, LEFT of search bar (after it in RTL flow) */}
        <div className="hidden min-[1440px]:flex items-center gap-3 flex-shrink-0 mx-2">
          <Link href="/about"
            className="h-8 px-3.5 rounded-full text-[#1F5038] font-semibold text-sm border-2 border-[#17402D]/15 bg-white/60 hover:border-[#17402D] hover:bg-white transition-all duration-200 flex items-center whitespace-nowrap"
          >אודות</Link>
          <Link href="/contact"
            className="h-8 px-3.5 rounded-full text-[#1F5038] font-semibold text-sm border-2 border-[#17402D]/15 bg-white/60 hover:border-[#17402D] hover:bg-white transition-all duration-200 flex items-center whitespace-nowrap"
          >צרו קשר</Link>
          <Link href="/vendors"
            className="h-8 px-3.5 rounded-full text-[#1F5038] font-semibold text-sm border-2 border-[#17402D]/15 bg-white/60 hover:border-[#17402D] hover:bg-white transition-all duration-200 flex items-center whitespace-nowrap"
          >לעסקים</Link>
          <Link href="/pricing"
            className="h-8 px-3.5 rounded-full text-[#1F5038] font-semibold text-sm border-2 border-[#17402D]/15 bg-white/60 hover:border-[#17402D] hover:bg-white transition-all duration-200 flex items-center whitespace-nowrap"
          >מחירים</Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          {/* Small-phone search icon. Tablet and desktop use the real search bar above. */}
          <button
            className="md:hidden flex items-center justify-center h-11 w-11 rounded-full hover:bg-[#EFF5F0] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F]"
            onClick={() => setMobileSearchOpen(true)}
            aria-label="פתיחת חיפוש"
          >
            <Search className="h-[18px] w-[18px] text-slate-600" />
          </button>

          {/* Favorites button */}
          <button
            onClick={onFavoritesOpen}
            className="relative flex items-center justify-center h-11 w-11 rounded-full border-2 border-[#17402D]/15 bg-white/60 hover:border-rose-400 hover:bg-rose-50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            aria-label="מועדפים"
          >
            <Heart className={`h-[18px] w-[18px] transition-colors duration-200 ${favCount > 0 ? "fill-rose-500 text-rose-500" : "text-slate-500"}`} />
            {favCount > 0 && (
              <span className="absolute -top-1 -left-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold px-1 shadow-sm">
                {favCount > 99 ? "99+" : favCount}
              </span>
            )}
          </button>

          {/* CTA — swaps to "לוח בקרה" once the user owns an active paid business.
              Otherwise routes to /pricing where they start with the launch offer. */}
          <div className="hidden min-[1440px]:block">
            {authChecked ? (
              <MagneticButton distance={0.45}>
                <Link
                  href={showDashboardCta ? "/dashboard" : "/pricing"}
                  className="group flex items-center gap-1.5 h-10 px-5 rounded-full font-bold text-sm text-white bg-[#C4552D] hover:bg-[#A8441F] border-2 border-[#8A3618] shadow-[2px_2px_0_0_#8A3618] hover:shadow-[3px_3px_0_0_#8A3618] hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4552D]"
                >
                  {showDashboardCta ? (
                    <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" aria-hidden="true" />
                  )}
                  <span>{showDashboardCta ? "לוח בקרה" : "פרסום עסק"}</span>
                </Link>
              </MagneticButton>
            ) : (
              <div className="h-10 w-[170px]" aria-hidden="true" />
            )}
          </div>

          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                className="flex items-center justify-center h-10 w-10 rounded-full bg-[#2D6A4F] text-white font-medium text-sm hover:bg-[#1F5038] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2 shadow-sm"
                aria-label="תפריט משתמש"
                aria-haspopup="true"
                aria-expanded={userMenuOpen}
                onClick={() => setUserMenuOpen((open) => !open)}
              >
                {user.email?.[0]?.toUpperCase() ?? "U"}
              </button>
              <div className={`absolute left-0 top-full pt-1.5 w-44 z-50 ${userMenuOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
                <div className={`bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 py-1.5 transition-all duration-200 origin-top-left ${
                  userMenuOpen
                    ? "opacity-100 visible translate-y-0"
                    : "opacity-0 invisible -translate-y-2"
                }`}>
                  <div className="px-1">
                    <Link
                      href={showDashboardCta ? "/dashboard" : "/pricing"}
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-[#EFF5F0] hover:text-[#1F5038]"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      {showDashboardCta ? "לוח בקרה" : "פרסום עסק"}
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full rounded-lg px-3 py-2 text-right text-sm font-medium text-slate-700 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    >
                      יציאה
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="hidden min-[1440px]:flex items-center justify-center h-10 px-5 rounded-full bg-white text-[#17402D] font-bold text-sm border-2 border-[#17402D] shadow-[2px_2px_0_0_#17402D] hover:shadow-[3px_3px_0_0_#17402D] hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2"
            >
              כניסה
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            className="min-[1440px]:hidden flex items-center justify-center h-11 w-11 rounded-full hover:bg-[#EFF5F0] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "סגירת תפריט" : "פתיחת תפריט"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-sheet"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-slate-600" />
            ) : (
              <Menu className="h-5 w-5 text-slate-600" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile search overlay */}
      {mobileSearchOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#F7F3EA]/98 backdrop-blur-sm flex items-start px-4 pt-[max(1rem,env(safe-area-inset-top))] fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="חיפוש מיקום"
        >
          <div className="flex-1">
            {onLocationSelect ? (
              <PlacesSearchBar
                onLocationSelect={(loc) => {
                  onLocationSelect(loc);
                  setMobileSearchOpen(false);
                }}
              />
            ) : (
              <form onSubmit={submitSiteSearch} className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
                <input
                  type="search"
                  placeholder="חפשו עסק, שכונה או מוצר..."
                  autoFocus
                  value={siteSearch}
                  onChange={(event) => setSiteSearch(event.target.value)}
                  className="w-full h-12 rounded-full border border-slate-200 pe-10 ps-20 text-base focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                  aria-label="חיפוש"
                />
                <button
                  type="submit"
                  className="absolute left-1 top-1/2 h-10 -translate-y-1/2 rounded-full bg-[#2D6A4F] px-4 text-sm font-bold text-white"
                >
                  חיפוש
                </button>
              </form>
            )}
          </div>
          <button
            className="ms-3 h-12 px-4 text-slate-600 font-medium text-sm hover:text-[#2D6A4F] transition-colors"
            onClick={() => setMobileSearchOpen(false)}
          >
            ביטול
          </button>
        </div>
      )}

      {/* Mobile menu */}
      {/* Mobile bottom sheet */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="min-[1440px]:hidden fixed inset-x-0 bottom-0 top-[72px] z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          {/* Sheet */}
          <div
            id="mobile-navigation-sheet"
            className="brand-canvas min-[1440px]:hidden fixed inset-x-0 bottom-0 z-50 max-h-[calc(100dvh-72px)] overflow-y-auto rounded-t-[28px] border-t-2 border-[#17402D] px-5 pt-3 pb-[max(2rem,env(safe-area-inset-bottom))] shadow-[0_-8px_40px_rgba(0,0,0,0.15)]"
            dir="rtl"
            style={{ animation: "slideUp 0.25s ease-out" }}
            role="dialog"
            aria-modal="true"
            aria-label="תפריט ראשי"
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full bg-[#E5E7EB] mx-auto mb-5" />

            {!user && (
              <div className="flex gap-3 mb-5">
                <Link
                  href="/auth/login"
                  className="flex-1 h-12 flex items-center justify-center rounded-2xl bg-[#2D6A4F] text-white font-bold text-sm shadow-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  כניסה
                </Link>
                <Link
                  href="/auth/register"
                  className="flex-1 h-12 flex items-center justify-center rounded-2xl border-2 border-[#2D6A4F] text-[#2D6A4F] font-bold text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  הרשמה
                </Link>
              </div>
            )}

            {user && (
              <div className="flex items-center gap-3 mb-5 p-3 bg-[#EFF5F0] rounded-2xl border-2 border-[#17402D]/10">
                <div className="h-10 w-10 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {user.email?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#17402D] truncate">{user.email}</p>
                </div>
              </div>
            )}

            <nav className="grid grid-cols-2 gap-2.5" aria-label="קישורי אתר">
              {[
                { id: "primary-cta", href: showDashboardCta ? "/dashboard" : "/pricing", label: showDashboardCta ? "לוח בקרה" : "פרסום עסק", icon: showDashboardCta ? LayoutDashboard : Store, bg: "#EFF5F0", border: "#17402D", text: "#17402D" },
                { id: "vendors", href: "/vendors", label: "לעסקים", icon: Store, bg: "#FFFFFF", border: "#17402D", text: "#17402D" },
                { id: "pricing", href: "/pricing", label: "מחירים", icon: BadgeDollarSign, bg: "#FFFFFF", border: "#17402D", text: "#17402D" },
                { id: "about", href: "/about", label: "אודות", icon: Info, bg: "#FFFFFF", border: "#17402D", text: "#17402D" },
                { id: "contact", href: "/contact", label: "צרו קשר", icon: Mail, bg: "#FBF1EA", border: "#8A3618", text: "#8A3618" },
              ].map(({ id, href, label, icon: Icon, bg, border, text }) => (
                <Link
                  key={id}
                  href={href}
                  className="flex flex-col items-center justify-center gap-1.5 py-4 px-3 rounded-2xl font-semibold text-sm transition-all active:scale-95 border-2 shadow-[2px_2px_0_0_rgba(23,64,45,0.2)]"
                  style={{ backgroundColor: bg, borderColor: border, color: text }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="h-6 w-6" aria-hidden="true" />
                  {label}
                </Link>
              ))}
            </nav>

            {user && (
              <button
                onClick={() => { supabase.auth.signOut(); setMobileMenuOpen(false); }}
                className="mt-2.5 w-full flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-rose-500 font-semibold text-sm border border-rose-200 bg-rose-50 transition-colors active:scale-95"
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
                יציאה
              </button>
            )}
          </div>
        </>
      )}

      <style jsx global>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </header>
  );
}
