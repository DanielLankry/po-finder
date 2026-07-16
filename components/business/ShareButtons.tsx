"use client";

import { useState, useRef } from "react";
import { MessageCircle, QrCode, X, Download } from "lucide-react";
import QRCode from "react-qr-code";

interface ShareButtonsProps {
  businessId: string;
  businessName: string;
}

export default function ShareButtons({ businessId, businessName }: ShareButtonsProps) {
  const [showQR, setShowQR] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const businessUrl = `https://pokarov.co.il/businesses/${businessId}`;
  const waMessage = `היי! מצאתי את ${businessName} בפה קרוב 🗺️ תבדוק אותם: ${businessUrl}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(waMessage)}`;

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = 300;
      canvas.height = 300;
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 300, 300);
        ctx.drawImage(img, 0, 0, 300, 300);
      }
      URL.revokeObjectURL(url);
      const pngUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = `qr-${businessId}.png`;
      a.click();
    };

    img.src = url;
  };

  return (
    <>
      {/* Share buttons row */}
      <div className="flex gap-2 w-full" dir="rtl">
        {/* WhatsApp share */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-gradient-to-l from-[#2D6A4F] to-[#4A8B66] hover:from-[#1F5038] hover:to-[#2D6A4F] text-white font-medium text-sm transition-all duration-150 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2"
          aria-label="שתף בוואטסאפ"
        >
          <MessageCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          שתף בוואטסאפ
        </a>

        {/* QR Code button */}
        <button
          onClick={() => setShowQR(true)}
          className="flex items-center justify-center gap-2 px-4 h-11 rounded-xl border border-slate-200 text-slate-700 hover:border-[#2D6A4F] hover:text-[#2D6A4F] hover:bg-emerald-50 font-medium text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2"
          aria-label="הצג קוד QR"
        >
          <QrCode className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">קוד QR</span>
        </button>
      </div>

      {/* QR Modal */}
      {showQR && (
        <div
          className="brand-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
          dir="rtl"
          onClick={(e) => { if (e.target === e.currentTarget) setShowQR(false); }}
          role="dialog"
          aria-modal="true"
          aria-label="קוד QR לשיתוף"
        >
          <div className="brand-dialog-surface relative flex w-full max-w-xs flex-col items-center gap-4 p-6">
            {/* Close button */}
            <button
              onClick={() => setShowQR(false)}
              className="brand-icon-button absolute top-3 left-3 h-11 w-11"
              aria-label="סגור"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-display text-3xl leading-none text-[#17402D]">{businessName}</h3>
            <p className="text-xs text-slate-500 text-center">סרוק כדי לפתוח את הדף</p>

            {/* QR Code */}
            <div
              ref={qrRef}
              className="rounded-xl border-2 border-[#17402D]/25 bg-white p-3 shadow-[3px_3px_0_0_rgba(23,64,45,0.16)]"
            >
              <QRCode
                value={businessUrl}
                size={200}
                fgColor="#2D6A4F"
                bgColor="#ffffff"
                level="M"
              />
            </div>

            <p className="text-[11px] text-slate-400 text-center break-all leading-relaxed">
              {businessUrl}
            </p>

            {/* Download button */}
            <button
              onClick={downloadQR}
              className="brand-button flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-black"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              הורד QR
            </button>
          </div>
        </div>
      )}
    </>
  );
}
