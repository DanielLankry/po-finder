"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Mail, Phone, MapPin, Send } from "lucide-react";

export default function ContactPage() {
  const [formState, setFormState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormState("sending");
    // In production, wire this to an API route or email service
    // For now, simulate sending
    await new Promise((r) => setTimeout(r, 1000));
    setFormState("sent");
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white pt-[88px] pb-16" dir="rtl">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="font-display font-extrabold text-3xl text-stone-900 mb-2">
            צרו קשר
          </h1>
          <p className="text-stone-500 text-sm mb-8">
            נשמח לשמוע מכם — שאלות, הצעות, או בעיות
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Contact info sidebar */}
            <div className="md:col-span-1 space-y-6">
              <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200">
                <h2 className="font-display font-bold text-lg text-stone-900 mb-4">
                  דרכי התקשרות
                </h2>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-[#059669] mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <div>
                      <p className="font-medium text-stone-900 text-sm">דוא&quot;ל</p>
                      <a
                        href="mailto:support@po.co.il"
                        className="text-[#059669] text-sm hover:underline"
                      >
                        support@po.co.il
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-[#059669] mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <div>
                      <p className="font-medium text-stone-900 text-sm">טלפון</p>
                      <p className="text-stone-500 text-sm">[יעודכן בקרוב]</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-[#059669] mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <div>
                      <p className="font-medium text-stone-900 text-sm">כתובת</p>
                      <p className="text-stone-500 text-sm">[יעודכן בקרוב]</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="text-stone-500 text-xs space-y-1">
                <p>שעות מענה: א׳–ה׳, 9:00–17:00</p>
                <p>אנו מתחייבים להשיב תוך 3 ימי עסקים.</p>
              </div>
            </div>

            {/* Contact form */}
            <div className="md:col-span-2">
              {formState === "sent" ? (
                <div className="bg-emerald-50 rounded-2xl p-8 border border-emerald-200 text-center">
                  <div className="h-16 w-16 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-4">
                    <Send className="h-8 w-8 text-white" aria-hidden="true" />
                  </div>
                  <h2 className="font-display font-bold text-xl text-stone-900 mb-2">
                    ההודעה נשלחה בהצלחה!
                  </h2>
                  <p className="text-stone-600">
                    תודה על פנייתכם. נחזור אליכם בהקדם האפשרי.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-stone-900 mb-1.5"
                      >
                        שם מלא <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="name"
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full h-11 rounded-xl border border-stone-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent"
                        placeholder="השם שלכם"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-stone-900 mb-1.5"
                      >
                        דוא&quot;ל <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full h-11 rounded-xl border border-stone-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent"
                        placeholder="your@email.com"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium text-stone-900 mb-1.5"
                    >
                      נושא <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="subject"
                      required
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full h-11 rounded-xl border border-stone-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent bg-white"
                    >
                      <option value="">בחרו נושא...</option>
                      <option value="general">שאלה כללית</option>
                      <option value="business">הוספת עסק</option>
                      <option value="bug">דיווח על תקלה</option>
                      <option value="accessibility">נגישות</option>
                      <option value="privacy">פרטיות ומידע אישי</option>
                      <option value="billing">חיוב ותשלומים</option>
                      <option value="other">אחר</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-stone-900 mb-1.5"
                    >
                      הודעה <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent resize-none"
                      placeholder="כתבו את ההודעה שלכם..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={formState === "sending"}
                    className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {formState === "sending" ? (
                      <>
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        שולח...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" aria-hidden="true" />
                        שליחה
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
