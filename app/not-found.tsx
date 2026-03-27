"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const PIN_DOTS = [
  { x: 18, y: 62, delay: "0s", size: 3 },
  { x: 32, y: 75, delay: "0.3s", size: 2 },
  { x: 52, y: 70, delay: "0.6s", size: 2.5 },
  { x: 68, y: 58, delay: "0.9s", size: 2 },
  { x: 80, y: 72, delay: "1.2s", size: 3 },
  { x: 42, y: 82, delay: "1.5s", size: 2 },
];

export default function NotFound() {
  const [mounted, setMounted] = useState(false);
  const [pingIndex, setPingIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setPingIndex((i) => (i + 1) % PIN_DOTS.length);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAF7] px-4"
      dir="rtl"
    >
      {/* Animated map background */}
      <div className="relative w-full max-w-sm mb-8">
        {/* Map card */}
        <div
          className="relative w-full h-52 rounded-3xl overflow-hidden shadow-xl border border-black/[0.06]"
          style={{
            background:
              "linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 40%, #e0f2f1 70%, #e8f5e9 100%)",
          }}
        >
          {/* Grid lines */}
          <svg
            className="absolute inset-0 w-full h-full opacity-20"
            xmlns="http://www.w3.org/2000/svg"
          >
            {[0, 20, 40, 60, 80, 100].map((x) => (
              <line
                key={`v${x}`}
                x1={`${x}%`}
                y1="0"
                x2={`${x}%`}
                y2="100%"
                stroke="#059669"
                strokeWidth="1"
              />
            ))}
            {[0, 25, 50, 75, 100].map((y) => (
              <line
                key={`h${y}`}
                x1="0"
                y1={`${y}%`}
                x2="100%"
                y2={`${y}%`}
                stroke="#059669"
                strokeWidth="1"
              />
            ))}
          </svg>

          {/* Faded road lines */}
          <svg
            className="absolute inset-0 w-full h-full opacity-30"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0,90 Q50,70 100,85 T200,80 T300,90"
              stroke="#059669"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M0,130 Q80,110 160,135 T320,125"
              stroke="#047857"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M120,0 Q130,50 125,104 T130,208"
              stroke="#059669"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>

          {/* Scattered dots (other vendors) */}
          {mounted &&
            PIN_DOTS.map((dot, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  left: `${dot.x}%`,
                  top: `${dot.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div
                  className="rounded-full bg-[#059669]/40 border border-[#059669]/60"
                  style={{
                    width: `${dot.size * 4}px`,
                    height: `${dot.size * 4}px`,
                    animation:
                      pingIndex === i
                        ? "pulse 0.8s ease-out"
                        : "none",
                  }}
                />
              </div>
            ))}

          {/* Big broken pin in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="flex flex-col items-center"
              style={{
                animation: mounted ? "floatPin 3s ease-in-out infinite" : "none",
              }}
            >
              {/* Pin SVG */}
              <svg
                width="56"
                height="70"
                viewBox="0 0 40 50"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  filter:
                    "drop-shadow(0 8px 16px rgba(5,150,105,0.35)) drop-shadow(0 0 6px rgba(5,150,105,0.5))",
                }}
              >
                <defs>
                  <linearGradient id="pinGrad404" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
                <path
                  d="M20 0C9.507 0 1 8.507 1 19c0 13.255 17.5 29.5 18.25 30.188a1.125 1.125 0 0 0 1.5 0C21.5 48.5 39 32.255 39 19 39 8.507 30.493 0 20 0z"
                  fill="url(#pinGrad404)"
                />
                <text
                  x="20"
                  y="26"
                  textAnchor="middle"
                  fontFamily="'Segoe UI', Arial, sans-serif"
                  fontWeight="800"
                  fontSize="18"
                  fill="white"
                >
                  ?
                </text>
              </svg>

              {/* Shadow under pin */}
              <div
                className="w-6 h-2 bg-black/20 rounded-full mt-1"
                style={{
                  animation: mounted
                    ? "shadowPin 3s ease-in-out infinite"
                    : "none",
                  filter: "blur(3px)",
                }}
              />
            </div>
          </div>

          {/* Searching radar ring */}
          {mounted && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="rounded-full border-2 border-[#059669]/30"
                style={{
                  width: "120px",
                  height: "120px",
                  animation: "radarRing 2.5s ease-out infinite",
                }}
              />
              <div
                className="absolute rounded-full border-2 border-[#059669]/20"
                style={{
                  width: "120px",
                  height: "120px",
                  animation: "radarRing 2.5s ease-out 0.8s infinite",
                }}
              />
            </div>
          )}
        </div>

        {/* Location not found badge */}
        <div
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-lg border border-black/[0.06]"
          style={{
            animation: mounted ? "badgePop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.3s both" : "none",
          }}
        >
          <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          <span className="text-sm font-semibold text-[#222]">מיקום לא נמצא</span>
        </div>
      </div>

      {/* Text content */}
      <div
        className="text-center mt-8"
        style={{
          animation: mounted ? "fadeUp 0.6s ease-out 0.2s both" : "none",
        }}
      >
        <div className="flex items-baseline justify-center gap-3 mb-3">
          <span
            className="font-extrabold text-[80px] leading-none"
            style={{
              background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            4
          </span>
          {/* Pin as the 0 */}
          <svg
            width="52"
            height="65"
            viewBox="0 0 40 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              filter: "drop-shadow(0 4px 8px rgba(5,150,105,0.3))",
              animation: mounted ? "pinBob 2s ease-in-out 1s infinite" : "none",
            }}
          >
            <defs>
              <linearGradient id="pinGrad0" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
            <path
              d="M20 0C9.507 0 1 8.507 1 19c0 13.255 17.5 29.5 18.25 30.188a1.125 1.125 0 0 0 1.5 0C21.5 48.5 39 32.255 39 19 39 8.507 30.493 0 20 0z"
              fill="url(#pinGrad0)"
            />
            <text
              x="20"
              y="26"
              textAnchor="middle"
              fontFamily="'Segoe UI', Arial, sans-serif"
              fontWeight="800"
              fontSize="20"
              fill="white"
            >
              פ
            </text>
          </svg>
          <span
            className="font-extrabold text-[80px] leading-none"
            style={{
              background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            4
          </span>
        </div>

        <h1 className="font-bold text-[#111] text-2xl mb-2">העמוד לא נמצא</h1>
        <p className="text-[#888] text-base mb-8 leading-relaxed max-w-xs mx-auto">
          נראה שאיבדנו את הדרך.
          <br />
          ייתכן שהקישור שגוי או שהעמוד הוסר.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full text-white font-semibold text-[15px] shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669]"
            style={{
              background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
              boxShadow: "0 4px 16px rgba(5,150,105,0.4)",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            חזרה לדף הבית
          </Link>

          <Link
            href="/contact"
            className="inline-flex items-center justify-center h-12 px-8 rounded-full font-semibold text-[15px] border border-[#E5E7EB] bg-white text-[#555] hover:border-[#059669]/50 hover:bg-[#ECFDF5] hover:text-[#047857] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669]"
          >
            צרו קשר
          </Link>
        </div>
      </div>

      {/* CSS animations */}
      <style jsx global>{`
        @keyframes floatPin {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes shadowPin {
          0%, 100% { transform: scaleX(1); opacity: 0.2; }
          50% { transform: scaleX(0.6); opacity: 0.1; }
        }
        @keyframes radarRing {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes pinBob {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-6px) rotate(-3deg); }
          75% { transform: translateY(-3px) rotate(3deg); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes badgePop {
          from { opacity: 0; transform: translateX(-50%) scale(0.5); }
          to { opacity: 1; transform: translateX(-50%) scale(1); }
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(2.5); opacity: 0.3; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
