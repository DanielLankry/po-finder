"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Mail, Send, MessageCircle, Store, Bug, ShieldCheck, CreditCard, HelpCircle } from "lucide-react";

const SUBJECTS = [
  { value: "general",      label: "שאלה כללית",          icon: HelpCircle },
  { value: "business",     label: "הוספת עסק",            icon: Store },
  { value: "bug",          label: "דיווח על תקלה",        icon: Bug },
  { value: "privacy",      label: "פרטיות ומידע",         icon: ShieldCheck },
  { value: "billing",      label: "חיוב ותשלומים",        icon: CreditCard },
  { value: "other",        label: "אחר",                  icon: MessageCircle },
];

export default function ContactPage() {
  const [formState, setFormState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormState("sending");
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setFormState("sent");
    } catch {
      setFormState("error");
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FAFAF7] pt-[88px] pb-20" dir="rtl">
        <div className="max-w-2xl mx-auto px-4">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ECFDF5] mb-4">
              <Mail className="h-7 w-7 text-[#059669]" />
            </div>
            <h1 className="font-extrabold text-3xl text-[#111] mb-2">צרו קשר</h1>
            <p className="text-[#888] text-base">נשמח לשמוע מכם — שאלות, הצעות, או בעיות</p>
          </div>

          {formState === "sent" ? (
            <div className="bg-white rounded-3xl border border-[#E5E7EB] p-12 text-center shadow-sm">
              <div className="h-16 w-16 rounded-full bg-[#ECFDF5] flex items-center justify-center mx-auto mb-4">
                <Send className="h-8 w-8 text-[#059669]" />
              </div>
              <h2 className="font-bold text-xl text-[#111] mb-2">ההודעה נשלחה!</h2>
              <p className="text-[#888]">נחזור אליכם תוך 3 ימי עסקים.</p>
              <button
                onClick={() => { setFormState("idle"); setForm({ name: "", email: "", subject: "", message: "" }); }}
                className="mt-6 text-[#059669] text-sm font-semibold hover:underline"
              >
                שלח הודעה נוספת
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-sm overflow-hidden">
              {/* Email direct link banner */}
              <div className="bg-[#ECFDF5] border-b border-[#D1FAE5] px-8 py-4 flex items-center gap-3">
                <Mail className="h-4 w-4 text-[#059669] flex-shrink-0" />
                <p className="text-sm text-[#065F46]">
                  מעדיפים לשלוח מייל ישירות?{" "}
                  <a href="mailto:support@pokarov.co.il" className="font-semibold hover:underline">
                    support@pokarov.co.il
                  </a>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-5">
                {/* Name + Email */}
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
                      className="w-full h-11 rounded-xl border border-[#E5E7EB] bg-[#FAFAF7] px-4 text-sm text-[#111] placeholder:text-[#AAA] focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent focus:bg-white transition-all"
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
                      className="w-full h-11 rounded-xl border border-[#E5E7EB] bg-[#FAFAF7] px-4 text-sm text-[#111] placeholder:text-[#AAA] focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Subject — pill selector */}
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
                              ? "bg-[#059669] text-white border-[#059669] shadow-sm"
                              : "bg-white text-[#555] border-[#E5E7EB] hover:border-[#059669]/40 hover:text-[#059669]"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                  {/* Hidden required input */}
                  <input type="text" required value={form.subject} onChange={() => {}} className="sr-only" />
                </div>

                {/* Message */}
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
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAF7] px-4 py-3 text-sm text-[#111] placeholder:text-[#AAA] focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent focus:bg-white transition-all resize-none"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={formState === "sending" || !form.subject}
                  className="w-full h-12 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #059669 0%, #047857 100%)", boxShadow: "0 4px 16px rgba(5,150,105,0.3)" }}
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
              </form>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
