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
          // The floating control starts at tablet width; mobile reaches the
          // accessibility page through the navigation sheet without covering content.
          if (savedPosition && window.innerWidth >= 640) setPos(savedPosition);
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
    if (window.innerWidth < 640) return;
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
        className="fixed bottom-20 left-4 z-40 hidden h-12 w-12 select-none items-center justify-center rounded-full border-2 border-[#17402D] bg-[#2D6A4F] text-white shadow-[2px_2px_0_0_#17402D] transition-colors hover:bg-[#1F5038] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2 sm:flex sm:cursor-grab sm:active:cursor-grabbing"
        style={btnStyle}
        aria-label={open ? "סגירת תפריט נגישות" : "פתיחת תפריט נגישות"}
        aria-expanded={open}
        aria-controls="accessibility-panel"
      >
        {open ? <X className="h-5 w-5" /> : <Accessibility className="h-6 w-6" />}
      </button>

      {open && (
        <div
          id="accessibility-panel"
          className="brand-dialog-surface fixed bottom-[13.5rem] end-3 z-40 max-h-[calc(100dvh-15rem)] w-[calc(100vw-1.5rem)] max-w-72 overflow-y-auto p-5 fade-in sm:bottom-[136px] sm:left-4 sm:right-auto sm:max-h-[calc(100dvh-10rem)]"
          style={panelStyle}
          dir="rtl"
          role="dialog"
          aria-label="הגדרות נגישות"
        >
          <div className="mb-4">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8A3618]">התאמה אישית</p>
            <h2 className="font-display text-3xl leading-none text-[#17402D]">נגישות</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-[#2D6A4F]" aria-hidden="true" />
                <span className="text-sm text-stone-700">גודל טקסט</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => update({ fontSize: Math.max(0, settings.fontSize - 1) })} disabled={settings.fontSize === 0}
                  className="brand-control flex h-11 w-11 items-center justify-center rounded-xl text-[#17402D] disabled:opacity-30" aria-label="הקטנת טקסט">
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="text-xs text-stone-500 w-6 text-center" aria-live="polite">{["א", "א+", "א++"][settings.fontSize]}</span>
                <button onClick={() => update({ fontSize: Math.min(2, settings.fontSize + 1) })} disabled={settings.fontSize === 2}
                  className="brand-control flex h-11 w-11 items-center justify-center rounded-xl text-[#17402D] disabled:opacity-30" aria-label="הגדלת טקסט">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <ToggleRow icon={<Contrast className="h-4 w-4 text-[#2D6A4F]" />} label="ניגודיות גבוהה" active={settings.highContrast} onToggle={() => update({ highContrast: !settings.highContrast })} />
            <ToggleRow icon={<MousePointer2 className="h-4 w-4 text-[#2D6A4F]" />} label="סמן גדול" active={settings.bigCursor} onToggle={() => update({ bigCursor: !settings.bigCursor })} />
            <ToggleRow icon={<Link2 className="h-4 w-4 text-[#2D6A4F]" />} label="הדגשת קישורים" active={settings.highlightLinks} onToggle={() => update({ highlightLinks: !settings.highlightLinks })} />
            <ToggleRow icon={<Space className="h-4 w-4 text-[#2D6A4F]" />} label="ריווח אותיות" active={settings.letterSpacing} onToggle={() => update({ letterSpacing: !settings.letterSpacing })} />
          </div>
          <button onClick={reset} className="brand-control mt-4 h-11 w-full rounded-xl text-sm font-black text-[#17402D]">
            איפוס הגדרות
          </button>
          <a href="/accessibility" className="block mt-2 text-center text-xs text-[#2D6A4F] hover:underline">הצהרת נגישות מלאה</a>
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
        className="flex h-11 w-12 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F]">
        <span className={`relative h-7 w-11 rounded-full border-2 transition-all ${active ? "border-[#17402D] bg-[#2D6A4F] shadow-[2px_2px_0_0_#17402D]" : "border-[#17402D]/25 bg-[#F7F3EA]"}`}>
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${active ? "start-[22px]" : "start-0.5"}`} />
        </span>
      </button>
    </div>
  );
}
