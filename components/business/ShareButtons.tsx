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
          className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-gradient-to-l from-[#059669] to-[#10b981] hover:from-[#047857] hover:to-[#059669] text-white font-medium text-sm transition-all duration-150 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-offset-2"
          aria-label="שתף בוואטסאפ"
        >
          <MessageCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          שתף בוואטסאפ
        </a>

        {/* QR Code button */}
        <button
          onClick={() => setShowQR(true)}
          className="flex items-center justify-center gap-2 px-4 h-11 rounded-xl border border-slate-200 text-slate-700 hover:border-[#059669] hover:text-[#059669] hover:bg-emerald-50 font-medium text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-offset-2"
          aria-label="הצג קוד QR"
        >
          <QrCode className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">קוד QR</span>
        </button>
      </div>

      {/* QR Modal */}
      {showQR && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          dir="rtl"
          onClick={(e) => { if (e.target === e.currentTarget) setShowQR(false); }}
          role="dialog"
          aria-modal="true"
          aria-label="קוד QR לשיתוף"
        >
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xs flex flex-col items-center gap-4 relative">
            {/* Close button */}
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-3 left-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              aria-label="סגור"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-bold text-base text-slate-900">{businessName}</h3>
            <p className="text-xs text-slate-500 text-center">סרוק כדי לפתוח את הדף</p>

            {/* QR Code */}
            <div
              ref={qrRef}
              className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm"
            >
              <QRCode
                value={businessUrl}
                size={200}
                fgColor="#059669"
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
              className="flex items-center gap-2 w-full h-10 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-medium text-sm transition-colors justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-offset-2"
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
