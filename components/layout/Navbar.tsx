"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Menu, X, Plus, Heart } from "lucide-react";
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
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 h-[72px] flex items-center transition-all duration-300 ${
        scrolled
          ? "bg-[#FAFAF7]/85 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border-b border-white/20"
          : "bg-[#FAFAF7]/98 shadow-[0_1px_0_rgba(0,0,0,0.04)] border-b border-transparent"
      }`}
    >
      <nav
        className="w-full px-5 flex items-center gap-4"
        aria-label="ניווט ראשי"
        dir="rtl"
      >
        {/* Logo + tagline — RIGHT in RTL (start) */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            href="/"
            className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] rounded-lg"
            aria-label="פה קרוב — דף הבית"
          >
            <Image src="/logo.png" alt="פה קרוב" width={38} height={38} className="rounded-lg" />
          </Link>
          {/* Typewriter tagline */}
          <div className="flex items-center border-r border-[#E5E7EB] pr-3 overflow-hidden w-[175px] md:w-[295px]">
            <Typewriter
              text={[
                "לעסקים קטנים",
                "לדוכנים",
                "לעגלות קפה",
                "ליוצרים",
                "לשווקים ניידים",
                "לבעלי קיוסקים",
                "לאופים ביתיים",
                "לפרחנים",
                "לסוחרי וינטג׳",
                "לקייטרינג",
                "לישראלים",
              ]}
              speed={60}
              deleteSpeed={35}
              waitTime={2200}
              className="text-[#059669] font-extrabold text-[20px] md:text-[26px] whitespace-nowrap"
              wordColors={{ "לישראלים": "text-blue-500" }}
            />
          </div>
        </div>

        {/* Search bar — center (hidden on mobile) */}
        <div className="hidden md:flex flex-1 justify-center max-w-[400px] mx-auto">
          {onLocationSelect ? (
            <div className="w-full">
               <PlacesSearchBar onLocationSelect={onLocationSelect} />
            </div>
          ) : (
            <button
               onClick={() => setMobileSearchOpen(true)}
               className="flex items-center w-full h-12 rounded-full border border-black/5 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 px-2 group"
               aria-label="חיפוש עיר או שכונה"
             >
                <div className="flex-1 flex items-center justify-between px-4 text-sm">
                   <span className="font-bold text-[#222222]">בכל מקום</span>
                   <span className="w-[1px] h-6 bg-black/10 mx-3"></span>
                   <span className="text-[#717171] truncate font-medium">כל קטגוריה</span>
                </div>
               <div className="flex-shrink-0 h-9 w-9 rounded-full bg-[#059669] text-white flex items-center justify-center mr-1 group-hover:scale-105 transition-transform duration-300 shadow-md">
                 <Search className="h-[18px] w-[18px]" aria-hidden="true" />
               </div>
            </button>
          )}
        </div>

        {/* Nav links — desktop only, LEFT of search bar (after it in RTL flow) */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0 mx-2">
          <Link href="/about"
            className="h-8 px-3.5 rounded-full text-[#555] font-medium text-sm border border-stone-200 hover:border-[#059669]/50 hover:bg-[#ECFDF5] hover:text-[#047857] transition-all duration-200 flex items-center whitespace-nowrap"
          >אודות</Link>
          <Link href="/contact"
            className="h-8 px-3.5 rounded-full text-[#555] font-medium text-sm border border-stone-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 flex items-center whitespace-nowrap"
          >צרו קשר</Link>
          <Link href="/pricing"
            className="h-8 px-3.5 rounded-full text-[#555] font-medium text-sm border border-stone-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 transition-all duration-200 flex items-center whitespace-nowrap"
          >מחירים</Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Mobile search icon */}
          <button
            className="md:hidden flex items-center justify-center h-10 w-10 rounded-full hover:bg-blue-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669]"
            onClick={() => setMobileSearchOpen(true)}
            aria-label="פתיחת חיפוש"
          >
            <Search className="h-5 w-5 text-slate-600" />
          </button>

          {/* Favorites button */}
          <button
            onClick={onFavoritesOpen}
            className="relative flex items-center justify-center h-10 w-10 rounded-full border border-slate-200 hover:border-rose-300 hover:bg-rose-50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            aria-label="מועדפים"
          >
            <Heart className={`h-[18px] w-[18px] transition-colors duration-200 ${favCount > 0 ? "fill-rose-500 text-rose-500" : "text-slate-500"}`} />
            {favCount > 0 && (
              <span className="absolute -top-1 -left-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold px-1 shadow-sm">
                {favCount > 99 ? "99+" : favCount}
              </span>
            )}
          </button>

          {/* הוסיפו עסק — magnetic + gradient shine */}
          <div className="hidden md:block">
            <MagneticButton distance={0.45}>
              <Link
                href="/dashboard"
                className="group relative flex items-center gap-1.5 h-10 px-5 rounded-full font-semibold text-sm text-white overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669]"
                style={{
                  background: "linear-gradient(135deg,#059669 0%,#047857 100%)",
                  boxShadow: "0 2px 14px rgba(5,150,105,0.4)",
                }}
              >
                {/* Shine sweep on hover */}
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"
                  style={{ background: "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.35) 50%,transparent 60%)" }}
                />
                <Plus className="h-4 w-4 relative z-10 group-hover:rotate-90 transition-transform duration-300" aria-hidden="true" />
                <span className="relative z-10">הוסיפו עסק</span>
              </Link>
            </MagneticButton>
          </div>

          {user ? (
            <div className="relative group">
              <button
                className="flex items-center justify-center h-10 w-10 rounded-full bg-[#059669] text-white font-medium text-sm hover:bg-[#047857] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-offset-2 shadow-sm"
                aria-label="תפריט משתמש"
                aria-haspopup="true"
              >
                {user.email?.[0]?.toUpperCase() ?? "U"}
              </button>
              <div className="absolute left-0 top-full pt-1.5 w-44 z-50">
                <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 py-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top-left -translate-y-2 group-hover:translate-y-0">
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-[#ECFDF5] hover:text-[#047857] transition-colors rounded-lg mx-1 font-medium"
                  >
                    לוח בקרה
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-right px-4 py-2 text-sm text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition-colors rounded-lg mx-1 block font-medium"
                  >
                    יציאה
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="hidden md:flex items-center justify-center h-10 px-5 rounded-full bg-[#059669] text-white font-medium text-sm hover:bg-[#047857] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-offset-2 shadow-sm btn-press"
            >
              כניסה
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex items-center justify-center h-10 w-10 rounded-full hover:bg-blue-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "סגירת תפריט" : "פתיחת תפריט"}
            aria-expanded={mobileMenuOpen}
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
        <div className="fixed inset-0 z-50 bg-[#FAFAF7]/98 backdrop-blur-sm flex items-start pt-4 px-4 fade-in">
          <div className="flex-1">
            {onLocationSelect ? (
              <PlacesSearchBar
                onLocationSelect={(loc) => {
                  onLocationSelect(loc);
                  setMobileSearchOpen(false);
                }}
              />
            ) : (
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
                <input
                  type="search"
                  placeholder="חפשו עיר או שכונה..."
                  autoFocus
                  className="w-full h-12 rounded-full border border-slate-200 pe-10 ps-4 text-base focus:outline-none focus:ring-2 focus:ring-[#059669]"
                  aria-label="חיפוש"
                />
              </div>
            )}
          </div>
          <button
            className="ms-3 h-12 px-4 text-slate-600 font-medium text-sm hover:text-[#059669] transition-colors"
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
            className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Sheet */}
          <div
            className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-[28px] shadow-[0_-8px_40px_rgba(0,0,0,0.15)] pt-3 pb-8 px-5"
            dir="rtl"
            style={{ animation: "slideUp 0.25s ease-out" }}
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full bg-[#E5E7EB] mx-auto mb-5" />

            {!user && (
              <div className="flex gap-3 mb-5">
                <Link
                  href="/auth/login"
                  className="flex-1 h-12 flex items-center justify-center rounded-2xl bg-[#059669] text-white font-bold text-sm shadow-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  כניסה
                </Link>
                <Link
                  href="/auth/register"
                  className="flex-1 h-12 flex items-center justify-center rounded-2xl border-2 border-[#059669] text-[#059669] font-bold text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  הרשמה
                </Link>
              </div>
            )}

            {user && (
              <div className="flex items-center gap-3 mb-5 p-3 bg-[#F0FDF4] rounded-2xl">
                <div className="h-10 w-10 rounded-full bg-[#059669] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {user.email?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#065F46] truncate">{user.email}</p>
                </div>
              </div>
            )}

            <nav className="grid grid-cols-2 gap-2.5">
              {[
                { href: "/dashboard", label: user ? "לוח בקרה" : "הוסיפו עסק", emoji: "🏪", bg: "#F0FDF4", border: "#A7F3D0", text: "#065F46" },
                { href: "/pricing", label: "מחירים", emoji: "💳", bg: "#EFF6FF", border: "#BFDBFE", text: "#1E40AF" },
                { href: "/about", label: "אודות", emoji: "ℹ️", bg: "#F5F3FF", border: "#DDD6FE", text: "#5B21B6" },
                { href: "/contact", label: "צרו קשר", emoji: "📬", bg: "#FFF7ED", border: "#FED7AA", text: "#C2410C" },
              ].map(({ href, label, emoji, bg, border, text }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center justify-center gap-1.5 py-4 px-3 rounded-2xl font-semibold text-sm transition-all active:scale-95 border"
                  style={{ backgroundColor: bg, borderColor: border, color: text }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="text-2xl">{emoji}</span>
                  {label}
                </Link>
              ))}
            </nav>

            {user && (
              <button
                onClick={() => { supabase.auth.signOut(); setMobileMenuOpen(false); }}
                className="mt-2.5 w-full flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-rose-500 font-semibold text-sm border border-rose-200 bg-rose-50 transition-colors active:scale-95"
              >
                <span className="text-lg">🚪</span>
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

function PinIcon() {
  return (
    <svg
      width="28"
      height="35"
      viewBox="0 0 28 35"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M14 0C6.268 0 0 6.268 0 14c0 9.625 12.6 20.125 13.125 20.562a1.313 1.313 0 0 0 1.75 0C15.4 34.125 28 23.625 28 14 28 6.268 21.732 0 14 0z"
        fill="#059669"
      />
      <circle cx="14" cy="14" r="6" fill="white" />
    </svg>
  );
}
