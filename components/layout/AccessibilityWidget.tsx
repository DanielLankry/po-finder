"use client";

import { useState, useEffect, useCallback } from "react";
import { Accessibility, X, Plus, Minus, Type, Contrast, MousePointer2, Link2, Space } from "lucide-react";

interface A11ySettings {
  fontSize: number; // 0 = normal, 1 = large, 2 = x-large
  highContrast: boolean;
  bigCursor: boolean;
  highlightLinks: boolean;
  letterSpacing: boolean;
}

const DEFAULT_SETTINGS: A11ySettings = {
  fontSize: 0,
  highContrast: false,
  bigCursor: false,
  highlightLinks: false,
  letterSpacing: false,
};

export default function AccessibilityWidget() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<A11ySettings>(DEFAULT_SETTINGS);

  // Load saved settings
  useEffect(() => {
    try {
      const saved = localStorage.getItem("po-a11y");
      if (saved) {
        const parsed = JSON.parse(saved) as A11ySettings;
        setSettings(parsed);
        applySettings(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  const applySettings = useCallback((s: A11ySettings) => {
    const root = document.documentElement;

    // Font size
    const sizes = ["100%", "115%", "130%"];
    root.style.fontSize = sizes[s.fontSize] || "100%";

    // High contrast
    root.classList.toggle("a11y-high-contrast", s.highContrast);

    // Big cursor
    root.classList.toggle("a11y-big-cursor", s.bigCursor);

    // Highlight links
    root.classList.toggle("a11y-highlight-links", s.highlightLinks);

    // Letter spacing
    root.classList.toggle("a11y-letter-spacing", s.letterSpacing);
  }, []);

  function update(partial: Partial<A11ySettings>) {
    const next = { ...settings, ...partial };
    setSettings(next);
    applySettings(next);
    localStorage.setItem("po-a11y", JSON.stringify(next));
  }

  function reset() {
    setSettings(DEFAULT_SETTINGS);
    applySettings(DEFAULT_SETTINGS);
    localStorage.removeItem("po-a11y");
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 start-4 z-[55] h-12 w-12 rounded-full bg-[#059669] text-white shadow-lg hover:bg-[#047857] transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-offset-2"
        aria-label={open ? "סגירת תפריט נגישות" : "פתיחת תפריט נגישות"}
        aria-expanded={open}
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <Accessibility className="h-6 w-6" />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-[136px] start-4 z-[55] w-72 bg-white rounded-2xl shadow-popup border border-stone-200 p-5 fade-in"
          dir="rtl"
          role="dialog"
          aria-label="הגדרות נגישות"
        >
          <h2 className="font-display font-bold text-lg text-stone-900 mb-4">
            נגישות
          </h2>

          <div className="space-y-3">
            {/* Font Size */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-[#059669]" aria-hidden="true" />
                <span className="text-sm text-stone-700">גודל טקסט</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => update({ fontSize: Math.max(0, settings.fontSize - 1) })}
                  disabled={settings.fontSize === 0}
                  className="h-8 w-8 rounded-lg border border-stone-300 flex items-center justify-center text-stone-600 hover:bg-stone-50 disabled:opacity-30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669]"
                  aria-label="הקטנת טקסט"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="text-xs text-stone-500 w-6 text-center" aria-live="polite">
                  {["א", "א+", "א++"][settings.fontSize]}
                </span>
                <button
                  onClick={() => update({ fontSize: Math.min(2, settings.fontSize + 1) })}
                  disabled={settings.fontSize === 2}
                  className="h-8 w-8 rounded-lg border border-stone-300 flex items-center justify-center text-stone-600 hover:bg-stone-50 disabled:opacity-30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669]"
                  aria-label="הגדלת טקסט"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* High Contrast */}
            <ToggleRow
              icon={<Contrast className="h-4 w-4 text-[#059669]" />}
              label="ניגודיות גבוהה"
              active={settings.highContrast}
              onToggle={() => update({ highContrast: !settings.highContrast })}
            />

            {/* Big Cursor */}
            <ToggleRow
              icon={<MousePointer2 className="h-4 w-4 text-[#059669]" />}
              label="סמן גדול"
              active={settings.bigCursor}
              onToggle={() => update({ bigCursor: !settings.bigCursor })}
            />

            {/* Highlight Links */}
            <ToggleRow
              icon={<Link2 className="h-4 w-4 text-[#059669]" />}
              label="הדגשת קישורים"
              active={settings.highlightLinks}
              onToggle={() => update({ highlightLinks: !settings.highlightLinks })}
            />

            {/* Letter Spacing */}
            <ToggleRow
              icon={<Space className="h-4 w-4 text-[#059669]" />}
              label="ריווח אותיות"
              active={settings.letterSpacing}
              onToggle={() => update({ letterSpacing: !settings.letterSpacing })}
            />
          </div>

          {/* Reset */}
          <button
            onClick={reset}
            className="mt-4 w-full h-9 rounded-lg border border-stone-300 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669]"
          >
            איפוס הגדרות
          </button>

          {/* Link to full statement */}
          <a
            href="/accessibility"
            className="block mt-2 text-center text-xs text-[#059669] hover:underline"
          >
            הצהרת נגישות מלאה
          </a>
        </div>
      )}
    </>
  );
}

function ToggleRow({
  icon,
  label,
  active,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-stone-700">{label}</span>
      </div>
      <button
        onClick={onToggle}
        role="switch"
        aria-checked={active}
        aria-label={label}
        className={`relative h-6 w-11 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] ${
          active ? "bg-[#059669]" : "bg-stone-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            active ? "start-[22px]" : "start-0.5"
          }`}
        />
      </button>
    </div>
  );
}
