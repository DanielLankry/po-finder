"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Tag, Trash2, Plus } from "lucide-react";
import type { BusinessEvent } from "@/lib/types";

function formatHebrewDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("he-IL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Jerusalem",
  });
}

export default function EventsPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [events, setEvents] = useState<BusinessEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    event_date: "",
    start_time: "",
    end_time: "",
    price: "",
  });

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: biz } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!biz) { setLoading(false); return; }
      setBusinessId(biz.id);

      const { data: eventsData } = await supabase
        .from("business_events")
        .select("*")
        .eq("business_id", biz.id)
        .order("event_date", { ascending: true });

      setEvents(eventsData ?? []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!businessId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    const { data, error: err } = await supabase
      .from("business_events")
      .insert({
        business_id: businessId,
        title: form.title,
        description: form.description || null,
        event_date: form.event_date,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        price: form.price ? parseFloat(form.price) : null,
      })
      .select()
      .single();

    if (err) {
      setError("שגיאה בהוספת האירוע. נסו שוב.");
    } else {
      setEvents((prev) => [...prev, data].sort((a, b) => a.event_date.localeCompare(b.event_date)));
      setForm({ title: "", description: "", event_date: "", start_time: "", end_time: "", price: "" });
      setShowForm(false);
      setSuccess("✓ האירוע נוסף בהצלחה!");
    }
    setSaving(false);
  }

  async function handleDelete(eventId: string) {
    if (!businessId) return;
    setDeleting(eventId);
    setError(null);

    const { error: err } = await supabase
      .from("business_events")
      .delete()
      .eq("id", eventId)
      .eq("business_id", businessId);

    if (err) {
      setError("שגיאה במחיקת האירוע.");
    } else {
      setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
      setSuccess("✓ האירוע הוסר.");
    }
    setDeleting(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-4 border-emerald-200 border-t-[#059669] animate-spin" />
      </div>
    );
  }

  if (!businessId) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center" dir="rtl">
        <p className="text-stone-600 mb-4">יש ליצור פרופיל עסק תחילה</p>
        <a href="/dashboard/profile" className="text-[#059669] font-medium hover:underline">עריכת פרופיל ←</a>
      </div>
    );
  }

  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });
  const upcomingEvents = events.filter((e) => e.event_date >= todayStr);
  const pastEvents = events.filter((e) => e.event_date < todayStr);

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-xl text-stone-900">🎉 אירועים</h1>
          <p className="text-stone-500 text-sm mt-1">
            הוסיפו הופעות, מכירות, אירועים חד-פעמיים
          </p>
        </div>
        <Button
          onClick={() => { setShowForm(!showForm); setSuccess(null); setError(null); }}
          className="h-10 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-medium text-sm"
        >
          <Plus className="h-4 w-4 ml-1" />
          אירוע חדש
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h2 className="font-bold text-lg text-stone-900 mb-4">הוספת אירוע</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="block text-stone-700 font-medium text-sm mb-1.5">
                כותרת האירוע *
              </Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="למשל: הופעת שישי בלייב"
                required
                className="h-11 rounded-xl border-stone-200 focus-visible:ring-[#059669]"
              />
            </div>

            <div>
              <Label className="block text-stone-700 font-medium text-sm mb-1.5">
                תיאור (אופציונלי)
              </Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="פרטים נוספים על האירוע..."
                rows={3}
                className="rounded-xl border-stone-200 focus-visible:ring-[#059669] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="block text-stone-700 font-medium text-sm mb-1.5">
                  תאריך *
                </Label>
                <Input
                  type="date"
                  value={form.event_date}
                  onChange={(e) => setForm((p) => ({ ...p, event_date: e.target.value }))}
                  required
                  min={todayStr}
                  className="h-11 rounded-xl border-stone-200 focus-visible:ring-[#059669]"
                  dir="ltr"
                />
              </div>
              <div>
                <Label className="block text-stone-700 font-medium text-sm mb-1.5">
                  שעת התחלה
                </Label>
                <Input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))}
                  className="h-11 rounded-xl border-stone-200 focus-visible:ring-[#059669]"
                  dir="ltr"
                />
              </div>
              <div>
                <Label className="block text-stone-700 font-medium text-sm mb-1.5">
                  שעת סיום
                </Label>
                <Input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))}
                  className="h-11 rounded-xl border-stone-200 focus-visible:ring-[#059669]"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <Label className="block text-stone-700 font-medium text-sm mb-1.5">
                מחיר (₪) — השאירו ריק אם אין מחיר, 0 לכניסה חופשית
              </Label>
              <Input
                type="number"
                min="0"
                step="1"
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                placeholder="אופציונלי"
                className="h-11 rounded-xl border-stone-200 focus-visible:ring-[#059669] w-40"
                dir="ltr"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={saving}
                className="h-11 px-6 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-semibold"
              >
                {saving ? "...שומר" : "הוסף אירוע"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="h-11 px-6 rounded-xl"
              >
                ביטול
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Status messages */}
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {success && <p className="text-emerald-600 text-sm font-medium">{success}</p>}

      {/* Upcoming events */}
      {upcomingEvents.length > 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h2 className="font-bold text-base text-stone-900 mb-4">
            אירועים קרובים ({upcomingEvents.length})
          </h2>
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-stone-900 text-sm">{event.title}</h3>
                  {event.description && (
                    <p className="text-stone-500 text-xs mt-0.5 line-clamp-1">{event.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-stone-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-[#059669]" />
                      {formatHebrewDate(event.event_date)}
                    </span>
                    {event.start_time && (
                      <span className="flex items-center gap-1 tabular-nums">
                        <Clock className="h-3.5 w-3.5 text-[#059669]" />
                        {event.start_time.slice(0, 5)}
                        {event.end_time && ` – ${event.end_time.slice(0, 5)}`}
                      </span>
                    )}
                    {event.price != null && (
                      <span className="flex items-center gap-1">
                        <Tag className="h-3.5 w-3.5 text-[#059669]" />
                        {event.price === 0 ? "חינם" : `₪${event.price}`}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(event.id)}
                  disabled={deleting === event.id}
                  className="p-2 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                  title="מחיקת אירוע"
                >
                  {deleting === event.id ? (
                    <div className="h-4 w-4 rounded-full border-2 border-red-300 border-t-red-500 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : !showForm ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
          <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
            <Calendar className="h-7 w-7 text-[#059669]" />
          </div>
          <h2 className="font-bold text-lg text-stone-900 mb-1">אין אירועים קרובים</h2>
          <p className="text-stone-500 text-sm">
            הוסיפו הופעות, מכירות, או אירועים חד-פעמיים שיוצגו בדף העסק
          </p>
        </div>
      ) : null}

      {/* Past events */}
      {pastEvents.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 opacity-60">
          <h2 className="font-bold text-base text-stone-900 mb-4">
            אירועים שעברו ({pastEvents.length})
          </h2>
          <div className="space-y-2">
            {pastEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-stone-100 bg-stone-50 p-3"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-stone-600 text-sm font-medium">{event.title}</span>
                  <span className="text-stone-400 text-xs mr-2">
                    {formatHebrewDate(event.event_date)}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(event.id)}
                  disabled={deleting === event.id}
                  className="p-2 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
