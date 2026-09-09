"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Inbox,
  Mail,
  MessageSquareReply,
  RefreshCw,
  Send,
  TriangleAlert,
} from "lucide-react";

type ContactStatus = "new" | "replied";
type DeliveryStatus = "sending" | "sent" | "failed";

interface ContactReply {
  id: string;
  body: string;
  delivery_status: DeliveryStatus;
  created_at: string;
  sent_at: string | null;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  subject_label: string;
  message: string;
  status: ContactStatus;
  created_at: string;
  last_replied_at: string | null;
  replies: ContactReply[];
}

type QueueFilter = "all" | ContactStatus;

const DATE_FORMAT = new Intl.DateTimeFormat("he-IL", {
  dateStyle: "medium",
  timeStyle: "short",
});

/** Provide a private, branded support queue backed by Resend. */
export default function AdminContactPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<QueueFilter>("all");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /** Refresh the queue and retain the current note when it still exists. */
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/contact", { cache: "no-store" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "שגיאה בטעינת הפניות");
      const nextMessages: ContactMessage[] = body.messages ?? [];
      setMessages(nextMessages);
      setSelectedId((current) =>
        current && nextMessages.some((message) => message.id === current)
          ? current
          : nextMessages[0]?.id ?? null
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "שגיאה בטעינת הפניות");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = messages.find((message) => message.id === selectedId) ?? null;
  const counts = useMemo(
    () => ({
      all: messages.length,
      new: messages.filter((message) => message.status === "new").length,
      replied: messages.filter((message) => message.status === "replied").length,
    }),
    [messages]
  );
  const visibleMessages = messages.filter((message) => filter === "all" || message.status === filter);

  /** Deliver the current draft from support@ and reload its audit history. */
  async function sendReply() {
    if (!selected || !reply.trim() || sending) return;
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/admin/contact/${selected.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reply }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "שליחת המייל נכשלה");
      setReply("");
      setSuccess(`התשובה נשלחה אל ${selected.name} מ-support@pokarov.co.il`);
      await load();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "שליחת המייל נכשלה");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="p-4 md:p-8" dir="rtl">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border-2 border-[#8A3618] bg-[#F6E3D9] px-3 py-1 text-xs font-extrabold text-[#8A3618] shadow-[2px_2px_0_0_#8A3618]">
            <Inbox className="h-3.5 w-3.5" /> תיבת התמיכה
          </div>
          <h1 className="font-display text-4xl leading-none text-[#17402D]">פניות מהאתר</h1>
          <p className="mt-2 text-sm text-stone-600">קוראים, עונים ומתעדים — בלי לחשוף את המייל האישי שלך.</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-[#17402D] bg-[#FFFDF7] px-4 text-sm font-extrabold text-[#17402D] shadow-[3px_3px_0_0_#17402D] transition-transform hover:-translate-y-0.5 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> רענון
        </button>
      </header>

      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="סינון פניות">
        <FilterButton active={filter === "all"} onClick={() => setFilter("all")} label="הכול" count={counts.all} />
        <FilterButton active={filter === "new"} onClick={() => setFilter("new")} label="ממתינות" count={counts.new} />
        <FilterButton active={filter === "replied"} onClick={() => setFilter("replied")} label="נענו" count={counts.replied} />
      </div>

      {error ? (
        <div role="alert" className="mb-5 flex items-center gap-2 rounded-xl border-2 border-red-700 bg-red-50 p-3 text-sm font-bold text-red-800">
          <TriangleAlert className="h-5 w-5 shrink-0" /> {error}
        </div>
      ) : null}
      {success ? (
        <div role="status" className="mb-5 flex items-center gap-2 rounded-xl border-2 border-[#2D6A4F] bg-[#DDEBE0] p-3 text-sm font-bold text-[#17402D]">
          <CheckCircle2 className="h-5 w-5 shrink-0" /> {success}
        </div>
      ) : null}

      <div className="grid min-h-[620px] gap-5 xl:grid-cols-[minmax(18rem,0.78fr)_minmax(28rem,1.35fr)]">
        <section className="brand-panel-soft overflow-hidden bg-[#FFFDF7]" aria-label="רשימת פניות">
          <div className="border-b-2 border-[#17402D]/15 bg-[#FFF3B0] px-4 py-3">
            <p className="text-sm font-extrabold text-[#17402D]">פתקים שהגיעו מהשכונה</p>
          </div>
          <div className="max-h-[680px] space-y-2 overflow-y-auto p-3">
            {loading ? (
              <p className="py-16 text-center text-sm text-stone-500">טוען פניות...</p>
            ) : visibleMessages.length === 0 ? (
              <div className="py-16 text-center">
                <Mail className="mx-auto mb-3 h-9 w-9 text-[#2D6A4F]/50" />
                <p className="font-bold text-stone-600">אין פניות במסנן הזה</p>
              </div>
            ) : (
              visibleMessages.map((message, index) => (
                <button
                  type="button"
                  key={message.id}
                  onClick={() => {
                    setSelectedId(message.id);
                    setReply("");
                    setError(null);
                    setSuccess(null);
                  }}
                  aria-pressed={selectedId === message.id}
                  className={`w-full rounded-xl border-2 p-4 text-right transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4552D] ${
                    selectedId === message.id
                      ? "border-[#17402D] bg-[#EFF5F0] shadow-[3px_3px_0_0_#17402D]"
                      : "border-transparent bg-white hover:border-[#17402D]/25"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#17402D] bg-[#FFF3B0] text-xs font-black text-[#17402D]">
                      {messages.length - index}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate font-extrabold text-stone-950">{message.name}</span>
                        <StatusStamp status={message.status} />
                      </span>
                      <span className="mt-1 block text-xs font-bold text-[#8A3618]">{message.subject_label}</span>
                      <span className="mt-2 block truncate text-sm text-stone-600">{message.message}</span>
                      <span className="mt-2 block text-[11px] text-stone-500">{DATE_FORMAT.format(new Date(message.created_at))}</span>
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="brand-panel-soft bg-[#FFFDF7] p-4 sm:p-6" aria-label="פרטי הפנייה ומענה">
          {!selected ? (
            <div className="flex min-h-[520px] flex-col items-center justify-center text-center text-stone-500">
              <MessageSquareReply className="mb-3 h-10 w-10 text-[#2D6A4F]/50" />
              <p className="font-bold">בחרו פנייה כדי לקרוא ולענות</p>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-dashed border-[#17402D]/30 pb-5">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wide text-[#8A3618]">{selected.subject_label}</p>
                  <h2 className="mt-1 font-display text-3xl leading-none text-[#17402D]">פנייה מאת {selected.name}</h2>
                  <p className="mt-2 text-sm text-stone-600" dir="ltr">{selected.email}</p>
                </div>
                <StatusStamp status={selected.status} large />
              </div>

              <div className="mt-5 rounded-xl border-2 border-[#17402D] bg-[#FFF8DC] p-5 shadow-[4px_4px_0_0_#17402D]">
                <div className="mb-3 flex items-center justify-between gap-3 text-xs text-stone-500">
                  <span className="font-extrabold text-[#17402D]">ההודעה המקורית</span>
                  <time>{DATE_FORMAT.format(new Date(selected.created_at))}</time>
                </div>
                <p className="whitespace-pre-wrap text-[15px] leading-7 text-stone-800">{selected.message}</p>
              </div>

              {selected.replies.length > 0 ? (
                <div className="mt-6 space-y-3">
                  <h3 className="text-sm font-extrabold text-[#17402D]">היסטוריית תשובות</h3>
                  {selected.replies.map((item) => (
                    <article key={item.id} className="mr-4 rounded-xl border-2 border-[#2D6A4F]/30 bg-[#EFF5F0] p-4">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-[#17402D]">נשלח מ-support@pokarov.co.il</span>
                        <DeliveryStamp status={item.delivery_status} />
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-6 text-stone-700">{item.body}</p>
                      <time className="mt-2 block text-[11px] text-stone-500">{DATE_FORMAT.format(new Date(item.sent_at ?? item.created_at))}</time>
                    </article>
                  ))}
                </div>
              ) : null}

              <div className="mt-7 border-t-2 border-dashed border-[#17402D]/30 pt-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor="support-reply" className="font-extrabold text-[#17402D]">התשובה שלך</label>
                  <span className="rounded-full bg-[#DDEBE0] px-3 py-1 text-xs font-bold text-[#17402D]">מאת support@pokarov.co.il</span>
                </div>
                <textarea
                  id="support-reply"
                  value={reply}
                  onChange={(event) => setReply(event.target.value.slice(0, 5000))}
                  rows={7}
                  placeholder={`שלום ${selected.name},\n\nתודה שפנית אלינו...`}
                  className="w-full resize-y rounded-xl border-2 border-[#17402D] bg-white p-4 text-sm leading-6 text-stone-900 outline-none transition-shadow placeholder:text-stone-400 focus:shadow-[4px_4px_0_0_#C4552D]"
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-stone-500">{reply.length.toLocaleString("he-IL")} / 5,000 תווים</p>
                  <button
                    type="button"
                    onClick={() => void sendReply()}
                    disabled={sending || !reply.trim()}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-[#8A3618] bg-[#C4552D] px-5 text-sm font-extrabold text-white shadow-[4px_4px_0_0_#8A3618] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    <Send className="h-4 w-4" /> {sending ? "שולח..." : "שליחת תשובה"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/** Render one compact queue filter with a live count. */
function FilterButton({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-11 rounded-xl border-2 px-4 text-sm font-extrabold ${active ? "border-[#17402D] bg-[#17402D] text-white shadow-[3px_3px_0_0_#8A3618]" : "border-[#17402D]/25 bg-[#FFFDF7] text-stone-600"}`}
    >
      {label} <span className="mr-1 opacity-75">({count})</span>
    </button>
  );
}

/** Render the high-level customer-conversation status. */
function StatusStamp({ status, large = false }: { status: ContactStatus; large?: boolean }) {
  const replied = status === "replied";
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 font-extrabold ${large ? "text-sm" : "text-[10px]"} ${replied ? "border-[#2D6A4F] bg-[#DDEBE0] text-[#17402D]" : "border-[#8A3618] bg-[#F6E3D9] text-[#8A3618]"}`}>
      {replied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
      {replied ? "נענה" : "ממתין"}
    </span>
  );
}

/** Render Resend delivery state for one historic answer. */
function DeliveryStamp({ status }: { status: DeliveryStatus }) {
  const labels: Record<DeliveryStatus, string> = { sending: "בשליחה", sent: "נשלח", failed: "נכשל" };
  return (
    <span className={`inline-flex items-center gap-1 font-bold ${status === "failed" ? "text-red-700" : "text-[#2D6A4F]"}`}>
      {status === "failed" ? <TriangleAlert className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
      {labels[status]}
    </span>
  );
}
