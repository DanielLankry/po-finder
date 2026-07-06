"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Mail, Send, MessageCircle, Store, Bug, ShieldCheck, CreditCard, HelpCircle } from "lucide-react";
import { BUSINESS_INFO, getWhatsAppHref } from "@/lib/site-config";

const SUBJECTS = [
  { value: "general", label: "שאלה כללית", icon: HelpCircle },
  { value: "business", label: "הצטרפות עסק", icon: Store },
  { value: "bug", label: "דיווח על תקלה", icon: Bug },
  { value: "privacy", label: "פרטיות ומידע", icon: ShieldCheck },
  { value: "billing", label: "חיוב ותשלומים", icon: CreditCard },
  { value: "other", label: "אחר", icon: MessageCircle },
];

const whatsappHref = getWhatsAppHref();

export default function ContactPage() {
  const [formState, setFormState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    privacyAccepted: false,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormState("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to send contact form");
      setFormState("sent");
    } catch {
      setFormState("error");
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F7F3EA] pt-[88px] pb-20" dir="rtl">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF5F0] mb-4">
              <Mail className="h-7 w-7 text-[#2D6A4F]" />
            </div>
            <h1 className="font-extrabold text-3xl text-[#111] mb-2">צרו קשר</h1>
            <p className="text-[#888] text-base">שאלות, הצטרפות לעסק או בירור על השירות מתחילים כאן.</p>
          </div>

          <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-sm overflow-hidden mb-6">
            <div className="bg-[#EFF5F0] border-b border-[#DDEBE0] px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-[#17402D]">
                {whatsappHref
                  ? "לפרטים, הצטרפות או שאלות לגבי השירות ניתן לפנות אלינו בוואטסאפ או במייל."
                  : "לפרטים, הצטרפות או שאלות לגבי השירות ניתן לפנות אלינו במייל."}
              </p>
              <div className="flex flex-wrap gap-2">
                {whatsappHref ? (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full bg-[#25D366] text-white text-sm font-semibold hover:bg-[#1EB856] transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    דברו איתנו בוואטסאפ
                  </a>
                ) : null}
                <a
                  href={`mailto:${BUSINESS_INFO.contactEmail}`}
                  className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full border border-[#C3DCC9] bg-white text-[#17402D] text-sm font-semibold hover:bg-[#F9FFF9] transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  {BUSINESS_INFO.contactEmail}
                </a>
              </div>
            </div>

            {formState === "sent" ? (
              <div className="p-12 text-center">
                <div className="h-16 w-16 rounded-full bg-[#EFF5F0] flex items-center justify-center mx-auto mb-4">
                  <Send className="h-8 w-8 text-[#2D6A4F]" />
                </div>
                <h2 className="font-bold text-xl text-[#111] mb-2">ההודעה נשלחה</h2>
                <p className="text-[#888]">נחזור אליכם תוך 3 ימי עסקים.</p>
                <button
                  onClick={() => {
                    setFormState("idle");
                    setForm({ name: "", email: "", subject: "", message: "", privacyAccepted: false });
                  }}
                  className="mt-6 text-[#2D6A4F] text-sm font-semibold hover:underline"
                >
                  שלחו הודעה נוספת
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-8 space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-[#111] mb-1.5">
                      שם מלא <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="השם שלכם"
                      className="w-full h-11 rounded-xl border border-[#E5E7EB] bg-[#F7F3EA] px-4 text-sm text-[#111] placeholder:text-[#AAA] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] focus:border-transparent focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-[#111] mb-1.5">
                      דוא&quot;ל <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="your@email.com"
                      dir="ltr"
                      className="w-full h-11 rounded-xl border border-[#E5E7EB] bg-[#F7F3EA] px-4 text-sm text-[#111] placeholder:text-[#AAA] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] focus:border-transparent focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#111] mb-2">
                    נושא <span className="text-red-400">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SUBJECTS.map((s) => {
                      const Icon = s.icon;
                      return (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setForm({ ...form, subject: s.value })}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-all ${
                            form.subject === s.value
                              ? "bg-[#2D6A4F] text-white border-[#2D6A4F] shadow-sm"
                              : "bg-white text-[#555] border-[#E5E7EB] hover:border-[#2D6A4F]/40 hover:text-[#2D6A4F]"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                  <input type="text" required value={form.subject} onChange={() => {}} className="sr-only" />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-[#111] mb-1.5">
                    הודעה <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="כתבו את ההודעה שלכם..."
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#F7F3EA] px-4 py-3 text-sm text-[#111] placeholder:text-[#AAA] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] focus:border-transparent focus:bg-white transition-all resize-none"
                  />
                </div>

                <label className="flex items-start gap-3 rounded-xl border border-[#E5E7EB] bg-[#F7F3EA] p-3 text-xs text-[#666]">
                  <input
                    type="checkbox"
                    required
                    checked={form.privacyAccepted}
                    onChange={(e) => setForm({ ...form, privacyAccepted: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded border-[#D1D5DB] accent-[#2D6A4F]"
                  />
                  <span>
                    אני מאשר/ת שהפרטים יישמרו וישמשו לטיפול בפנייה, בהתאם{" "}
                    <Link href="/privacy" className="text-[#2D6A4F] hover:underline">
                      למדיניות הפרטיות
                    </Link>
                    .
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={formState === "sending" || !form.subject || !form.privacyAccepted}
                  className="w-full h-12 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #2D6A4F 0%, #1F5038 100%)", boxShadow: "0 4px 16px rgba(45,106,79,0.3)" }}
                >
                  {formState === "sending" ? (
                    <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />שולח...</>
                  ) : (
                    <><Send className="h-4 w-4" />שליחה</>
                  )}
                </button>

                <p className="text-center text-[#AAA] text-xs">
                  נשיב תוך 3 ימי עסקים • א׳–ה׳ 9:00–17:00
                </p>
                {formState === "error" && (
                  <p role="alert" className="text-center text-red-600 text-sm">
                    לא הצלחנו לשלוח את הפנייה. בדקו את הפרטים ונסו שוב.
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
