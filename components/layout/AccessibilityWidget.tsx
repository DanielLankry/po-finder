"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Accessibility, X, Plus, Minus, Type, Contrast, MousePointer2, Link2, Space } from "lucide-react";

interface A11ySettings {
  fontSize: number;
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

  // Drag state
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const applySettings = useCallback((s: A11ySettings) => {
    const root = document.documentElement;
    root.style.fontSize = ["100%", "115%", "130%"][s.fontSize] || "100%";
    root.classList.toggle("a11y-high-contrast", s.highContrast);
    root.classList.toggle("a11y-big-cursor", s.bigCursor);
    root.classList.toggle("a11y-highlight-links", s.highlightLinks);
    root.classList.toggle("a11y-letter-spacing", s.letterSpacing);
  }, []);

  // Load saved settings + saved position
  useEffect(() => {
    try {
      const saved = localStorage.getItem("po-a11y");
      const savedSettings = saved ? (JSON.parse(saved) as A11ySettings) : null;
      const savedPos = localStorage.getItem("po-a11y-pos");
      const savedPosition = savedPos ? (JSON.parse(savedPos) as { x: number; y: number }) : null;

      if (savedSettings || savedPosition) {
        queueMicrotask(() => {
          if (savedSettings) {
            setSettings(savedSettings);
            applySettings(savedSettings);
          }
          if (savedPosition) setPos(savedPosition);
        });
      }
    } catch { /* ignore */ }
  }, [applySettings]);

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

  // Drag handlers
  function onPointerDown(e: React.PointerEvent) {
    dragging.current = true;
    const rect = btnRef.current!.getBoundingClientRect();
    offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    btnRef.current!.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    const newX = e.clientX - offset.current.x;
    const newY = e.clientY - offset.current.y;
    const clampedX = Math.max(0, Math.min(window.innerWidth - 48, newX));
    const clampedY = Math.max(0, Math.min(window.innerHeight - 48, newY));
    setPos({ x: clampedX, y: clampedY });
  }

  function onPointerUp() {
    if (!dragging.current) return;
    dragging.current = false;
    if (pos) localStorage.setItem("po-a11y-pos", JSON.stringify(pos));
  }

  const btnStyle: React.CSSProperties = pos
    ? { position: "fixed", left: pos.x, top: pos.y, bottom: "auto", insetInlineStart: "auto", touchAction: "none" }
    : { touchAction: "none" };

  const panelStyle: React.CSSProperties = pos
    ? {
        position: "fixed",
        left: pos.x > window.innerWidth / 2 ? pos.x - 280 : pos.x + 56,
        top: Math.min(pos.y, window.innerHeight - 420),
        bottom: "auto",
        insetInlineStart: "auto",
      }
    : {};

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => { if (!dragging.current) setOpen(!open); }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="fixed bottom-20 start-4 z-[55] h-12 w-12 rounded-full bg-[#059669] text-white shadow-lg hover:bg-[#047857] transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-offset-2 cursor-grab active:cursor-grabbing select-none"
        style={btnStyle}
        aria-label={open ? "סגירת תפריט נגישות" : "פתיחת תפריט נגישות"}
        aria-expanded={open}
      >
        {open ? <X className="h-5 w-5" /> : <Accessibility className="h-6 w-6" />}
      </button>

      {open && (
        <div
          className="fixed bottom-[136px] start-4 z-[55] w-72 bg-white rounded-2xl shadow-popup border border-stone-200 p-5 fade-in"
          style={panelStyle}
          dir="rtl"
          role="dialog"
          aria-label="הגדרות נגישות"
        >
          <h2 className="font-display font-bold text-lg text-stone-900 mb-4">נגישות</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-[#059669]" aria-hidden="true" />
                <span className="text-sm text-stone-700">גודל טקסט</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => update({ fontSize: Math.max(0, settings.fontSize - 1) })} disabled={settings.fontSize === 0}
                  className="h-8 w-8 rounded-lg border border-stone-300 flex items-center justify-center text-stone-600 hover:bg-stone-50 disabled:opacity-30 transition-colors" aria-label="הקטנת טקסט">
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="text-xs text-stone-500 w-6 text-center" aria-live="polite">{["א", "א+", "א++"][settings.fontSize]}</span>
                <button onClick={() => update({ fontSize: Math.min(2, settings.fontSize + 1) })} disabled={settings.fontSize === 2}
                  className="h-8 w-8 rounded-lg border border-stone-300 flex items-center justify-center text-stone-600 hover:bg-stone-50 disabled:opacity-30 transition-colors" aria-label="הגדלת טקסט">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <ToggleRow icon={<Contrast className="h-4 w-4 text-[#059669]" />} label="ניגודיות גבוהה" active={settings.highContrast} onToggle={() => update({ highContrast: !settings.highContrast })} />
            <ToggleRow icon={<MousePointer2 className="h-4 w-4 text-[#059669]" />} label="סמן גדול" active={settings.bigCursor} onToggle={() => update({ bigCursor: !settings.bigCursor })} />
            <ToggleRow icon={<Link2 className="h-4 w-4 text-[#059669]" />} label="הדגשת קישורים" active={settings.highlightLinks} onToggle={() => update({ highlightLinks: !settings.highlightLinks })} />
            <ToggleRow icon={<Space className="h-4 w-4 text-[#059669]" />} label="ריווח אותיות" active={settings.letterSpacing} onToggle={() => update({ letterSpacing: !settings.letterSpacing })} />
          </div>
          <button onClick={reset} className="mt-4 w-full h-9 rounded-lg border border-stone-300 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors">
            איפוס הגדרות
          </button>
          <a href="/accessibility" className="block mt-2 text-center text-xs text-[#059669] hover:underline">הצהרת נגישות מלאה</a>
        </div>
      )}
    </>
  );
}

function ToggleRow({ icon, label, active, onToggle }: { icon: React.ReactNode; label: string; active: boolean; onToggle: () => void; }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">{icon}<span className="text-sm text-stone-700">{label}</span></div>
      <button onClick={onToggle} role="switch" aria-checked={active} aria-label={label}
        className={`relative h-6 w-11 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] ${active ? "bg-[#059669]" : "bg-stone-300"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${active ? "start-[22px]" : "start-0.5"}`} />
      </button>
    </div>
  );
}
