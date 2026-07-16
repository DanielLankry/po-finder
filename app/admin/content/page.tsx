"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, MessageSquareText, RefreshCw, Star, Trash2 } from "lucide-react";

interface ModeratedReview {
  id: string;
  rating: number;
  comment: string | null;
  reviewer_name: string | null;
  business_name: string | null;
  user_name: string | null;
  created_at: string;
}

interface ModeratedEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  price: number | null;
  business_name: string | null;
  created_at: string;
}

/** Provide a single moderation queue for public reviews and business events. */
export default function AdminContentPage() {
  const [tab, setTab] = useState<"reviews" | "events">("reviews");
  const [reviews, setReviews] = useState<ModeratedReview[]>([]);
  const [events, setEvents] = useState<ModeratedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /** Refresh both queues together so counters and visible rows stay consistent. */
  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/content");
    const body = await response.json().catch(() => ({}));
    if (response.ok) {
      setReviews(body.reviews ?? []);
      setEvents(body.events ?? []);
    } else alert(body.error ?? "שגיאה בטעינת התוכן");
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  /** Remove one moderated item and update the matching queue immediately. */
  async function remove(type: "reviews" | "events", id: string) {
    if (!confirm("למחוק את התוכן לצמיתות?")) return;
    setDeletingId(id);
    const response = await fetch(`/api/admin/content/${type}/${id}`, { method: "DELETE" });
    const body = await response.json().catch(() => ({}));
    if (response.ok) {
      if (type === "reviews") setReviews((current) => current.filter((item) => item.id !== id));
      else setEvents((current) => current.filter((item) => item.id !== id));
    } else alert(body.error ?? "שגיאה במחיקת התוכן");
    setDeletingId(null);
  }

  const items = tab === "reviews" ? reviews : events;

  return (
    <div className="p-4 md:p-8" dir="rtl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-[#17402D]">ניהול תוכן</h1>
          <p className="text-sm text-stone-500">ביקורות ואירועים שמופיעים באתר הציבורי</p>
        </div>
        <button onClick={load} className="inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-[#17402D]/25 bg-white px-4 text-sm font-bold text-[#17402D]">
          <RefreshCw className="h-4 w-4" /> רענון
        </button>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl border-2 border-[#17402D]/15 bg-[#FFFDF7] p-2">
        <TabButton active={tab === "reviews"} onClick={() => setTab("reviews")} icon={MessageSquareText} label={`ביקורות (${reviews.length})`} />
        <TabButton active={tab === "events"} onClick={() => setTab("events")} icon={CalendarDays} label={`אירועים (${events.length})`} />
      </div>

      {loading ? (
        <p className="py-16 text-center text-stone-500">טוען תוכן...</p>
      ) : items.length === 0 ? (
        <div className="brand-panel-soft bg-[#FFFDF7] p-12 text-center text-stone-500">אין פריטים להצגה</div>
      ) : tab === "reviews" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {reviews.map((review) => (
            <article key={review.id} className="brand-panel-soft bg-[#FFFDF7] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-stone-950">{review.business_name ?? "עסק לא ידוע"}</p>
                  <p className="text-xs text-stone-500">{review.reviewer_name || review.user_name || "משתמש"} · {new Date(review.created_at).toLocaleDateString("he-IL")}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF3B0] px-2.5 py-1 text-xs font-bold text-[#8A3618]">
                  <Star className="h-3.5 w-3.5 fill-current" /> {review.rating}
                </span>
              </div>
              <p className="mt-4 min-h-10 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{review.comment || "ללא תגובה כתובה"}</p>
              <DeleteButton busy={deletingId === review.id} onClick={() => remove("reviews", review.id)} />
            </article>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {events.map((event) => (
            <article key={event.id} className="brand-panel-soft bg-[#FFFDF7] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-stone-950">{event.title}</p>
                  <p className="text-xs text-stone-500">{event.business_name ?? "עסק לא ידוע"}</p>
                </div>
                <span className="rounded-full bg-[#DDEBE0] px-2.5 py-1 text-xs font-bold text-[#17402D]">
                  {new Date(`${event.event_date}T12:00:00`).toLocaleDateString("he-IL")}
                </span>
              </div>
              <p className="mt-4 min-h-10 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{event.description || "ללא תיאור"}</p>
              <div className="mt-2 flex gap-4 text-xs text-stone-500">
                {event.start_time ? <span>שעה: {event.start_time.slice(0, 5)}</span> : null}
                {event.price != null ? <span>{event.price === 0 ? "ללא עלות" : `₪${event.price}`}</span> : null}
              </div>
              <DeleteButton busy={deletingId === event.id} onClick={() => remove("events", event.id)} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

/** Render an accessible tab with the shared admin visual language. */
function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof CalendarDays; label: string }) {
  return (
    <button onClick={onClick} aria-pressed={active} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold ${active ? "bg-[#17402D] text-white shadow-[2px_2px_0_0_#8A3618]" : "text-stone-600 hover:bg-[#EFF5F0]"}`}>
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

/** Keep destructive moderation actions consistent and visibly disabled in flight. */
function DeleteButton({ busy, onClick }: { busy: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={busy} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-100 px-4 text-sm font-bold text-red-700 disabled:opacity-50">
      <Trash2 className="h-4 w-4" /> {busy ? "מוחק..." : "מחיקה"}
    </button>
  );
}
