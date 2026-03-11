"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Search, Menu, X, Plus } from "lucide-react";
import { Typewriter } from "@/components/ui/typewriter";
import { MagneticButton } from "@/components/ui/magnetic-button";
import LogoIcon from "@/components/ui/LogoIcon";
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
            <LogoIcon size={38} />
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
        <div className="hidden md:flex items-center gap-2 flex-shrink-0 mx-2">
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
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Mobile search icon */}
          <button
            className="md:hidden flex items-center justify-center h-10 w-10 rounded-full hover:bg-blue-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669]"
            onClick={() => setMobileSearchOpen(true)}
            aria-label="פתיחת חיפוש"
          >
            <Search className="h-5 w-5 text-slate-600" />
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
              className="flex items-center justify-center h-10 px-5 rounded-full bg-[#059669] text-white font-medium text-sm hover:bg-[#047857] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-offset-2 shadow-sm btn-press"
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
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[72px] z-40 bg-[#FAFAF7] shadow-popup border-t border-slate-100 py-3 px-4 slide-in-right" dir="rtl">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 py-3 text-slate-700 font-medium hover:text-[#047857] transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Plus className="h-5 w-5" />
            הוסיפו עסק
          </Link>
          <Link
            href="/pricing"
            className="block py-3 text-slate-700 font-medium hover:text-[#047857] transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            מחירים
          </Link>
          <Link
            href="/about"
            className="block py-3 text-slate-700 font-medium hover:text-[#047857] transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            אודות
          </Link>
          <Link
            href="/contact"
            className="block py-3 text-slate-700 font-medium hover:text-[#047857] transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            צרו קשר
          </Link>
        </div>
      )}
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
