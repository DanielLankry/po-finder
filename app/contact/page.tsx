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
      <main className="brand-canvas min-h-screen pt-[88px] pb-20" dir="rtl">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="stamp-wiggle mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#17402D] bg-[#DDEBE0] shadow-[3px_3px_0_0_#17402D]">
              <Mail className="h-7 w-7 text-[#2D6A4F]" aria-hidden="true" />
            </div>
            <h1 className="mb-2 font-display text-5xl text-[#17402D]">צרו קשר</h1>
            <p className="text-base text-[#17402D]/65">שאלות, הצטרפות לעסק או בירור על השירות מתחילים כאן.</p>
          </div>

          <div className="brand-panel mb-6 overflow-hidden bg-[#FFFDF7]">
            <div className="flex flex-col gap-3 border-b-2 border-[#17402D] bg-[#DDEBE0] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
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
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 border-[#168A42] bg-[#25D366] px-4 text-sm font-semibold text-white shadow-[2px_2px_0_0_#168A42] transition-colors hover:bg-[#1EB856]"
                  >
                    <MessageCircle className="h-4 w-4" />
                    דברו איתנו בוואטסאפ
                  </a>
                ) : null}
                <a
                  href={`mailto:${BUSINESS_INFO.contactEmail}`}
                  className="brand-control inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-[#17402D]"
                >
                  <Mail className="h-4 w-4" />
                  {BUSINESS_INFO.contactEmail}
                </a>
              </div>
            </div>

            {formState === "sent" ? (
              <div className="p-8 text-center sm:p-12">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-[#17402D] bg-[#FFF3B0] shadow-[3px_3px_0_0_#17402D]">
                  <Send className="h-8 w-8 text-[#2D6A4F]" aria-hidden="true" />
                </div>
                <h2 className="font-display font-bold text-3xl text-[#17402D] mb-2">ההודעה נשלחה</h2>
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
              <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-8">
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
                      className="brand-control h-11 w-full rounded-xl px-4 text-base text-[#17402D] placeholder:text-[#17402D]/40 md:text-sm"
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
                      className="brand-control h-11 w-full rounded-xl px-4 text-base text-[#17402D] placeholder:text-[#17402D]/40 md:text-sm"
                    />
                  </div>
                </div>

                <fieldset>
                  <legend className="block text-sm font-semibold text-[#111] mb-2">
                    נושא <span className="text-red-400">*</span>
                  </legend>
                  <div className="flex flex-wrap gap-2" aria-required="true">
                    {SUBJECTS.map((s) => {
                      const Icon = s.icon;
                      return (
                        <label
                          key={s.value}
                          className="business-type-button flex min-h-11 cursor-pointer items-center gap-1.5 px-3 py-2 text-sm font-bold focus-within:outline focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-[#2D6A4F]/35"
                          data-active={form.subject === s.value}
                        >
                          <input
                            type="radio"
                            name="subject"
                            value={s.value}
                            checked={form.subject === s.value}
                            onChange={() => setForm({ ...form, subject: s.value })}
                            required
                            className="sr-only"
                          />
                          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                          {s.label}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

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
                    className="brand-control w-full resize-none rounded-xl px-4 py-3 text-base text-[#17402D] placeholder:text-[#17402D]/40 md:text-sm"
                  />
                </div>

                <label className="brand-panel-soft flex items-start gap-3 rounded-xl bg-[#FFFDF7] p-3 text-xs text-[#17402D]/70">
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
                  className="brand-button flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-base font-bold disabled:cursor-not-allowed disabled:opacity-50"
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
