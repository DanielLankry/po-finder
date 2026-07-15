"use client";

import { useState, useEffect, useRef } from "react";
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPinned } from "lucide-react";
import type { BusinessSchedule, WeeklyScheduleEntry } from "@/lib/types";
import { getLatestOwnedBusiness } from "@/lib/db/owned-businesses";

const LIBRARIES: ("places")[] = ["places"];

const DAYS = [
  { dow: 0, label: "ראשון" },
  { dow: 1, label: "שני" },
  { dow: 2, label: "שלישי" },
  { dow: 3, label: "רביעי" },
  { dow: 4, label: "חמישי" },
  { dow: 5, label: "שישי" },
  { dow: 6, label: "שבת" },
];

type DayForm = {
  is_active: boolean;
  open_time: string;
  close_time: string;
  address: string;
  lat: string;
  lng: string;
  note: string;
};

const EMPTY_DAY: DayForm = { is_active: false, open_time: "", close_time: "", address: "", lat: "", lng: "", note: "" };

export default function SchedulePage() {
  const [tab, setTab] = useState<"weekly" | "override">("weekly");
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Weekly template state
  const [weeklyForms, setWeeklyForms] = useState<Record<number, DayForm>>(
    Object.fromEntries(DAYS.map((d) => [d.dow, { ...EMPTY_DAY }]))
  );
  const weeklyAutocompletes = useRef<Record<number, google.maps.places.Autocomplete | null>>({});

  // Daily override state
  const [schedule, setSchedule] = useState<BusinessSchedule | null>(null);
  const [overrideForm, setOverrideForm] = useState({
    address: "", lat: "", lng: "", open_time: "", close_time: "", note: "",
  });
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  const supabase = createClient();
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: LIBRARIES,
    language: "he",
    region: "IL",
  });

  const today = new Date().toLocaleDateString("he-IL", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jerusalem",
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const biz = await getLatestOwnedBusiness(supabase);

      if (!biz) { setLoading(false); return; }
      setBusinessId(biz.id);

      // Load weekly template
      const { data: weeklyData } = await supabase
        .from("business_weekly_schedule")
        .select("*")
        .eq("business_id", biz.id);

      if (weeklyData?.length) {
        const forms: Record<number, DayForm> = Object.fromEntries(DAYS.map((d) => [d.dow, { ...EMPTY_DAY }]));
        for (const w of weeklyData as WeeklyScheduleEntry[]) {
          forms[w.day_of_week] = {
            is_active: w.is_active,
            open_time: w.open_time?.slice(0, 5) ?? "",
            close_time: w.close_time?.slice(0, 5) ?? "",
            address: w.address ?? "",
            lat: w.lat?.toString() ?? "",
            lng: w.lng?.toString() ?? "",
            note: w.note ?? "",
          };
        }
        setWeeklyForms(forms);
      }

      // Load today's override
      const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });
      const { data: sched } = await supabase
        .from("business_schedules")
        .select("*")
        .eq("business_id", biz.id)
        .eq("date", todayStr)
        .maybeSingle();

      if (sched) {
        setSchedule(sched);
        setOverrideForm({
          address: sched.address ?? "",
          lat: sched.lat?.toString() ?? "",
          lng: sched.lng?.toString() ?? "",
          open_time: sched.open_time?.slice(0, 5) ?? "",
          close_time: sched.close_time?.slice(0, 5) ?? "",
          note: sched.note ?? "",
        });
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  // ── Weekly save ────────────────────────────────────────────────────────────
  async function handleWeeklySave() {
    if (!businessId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    const invalidDay = DAYS.find(({ dow }) => {
      const day = weeklyForms[dow];
      return day.is_active && (
        !day.open_time ||
        !day.close_time ||
        day.open_time === day.close_time
      );
    });
    if (invalidDay) {
      setError(`ביום ${invalidDay.label} יש להזין שעת פתיחה ושעת סגירה שונות.`);
      setSaving(false);
      return;
    }

    const rows = DAYS.map(({ dow }) => ({
      business_id: businessId,
      day_of_week: dow,
      is_active: weeklyForms[dow].is_active,
      open_time: weeklyForms[dow].open_time || null,
      close_time: weeklyForms[dow].close_time || null,
      address: weeklyForms[dow].address || null,
      lat: weeklyForms[dow].lat ? parseFloat(weeklyForms[dow].lat) : null,
      lng: weeklyForms[dow].lng ? parseFloat(weeklyForms[dow].lng) : null,
      note: weeklyForms[dow].note || null,
      updated_at: new Date().toISOString(),
    }));

    const { error: err } = await supabase
      .from("business_weekly_schedule")
      .upsert(rows, { onConflict: "business_id,day_of_week" });

    if (err) setError("שגיאה בשמירת התבנית. נסו שוב.");
    else setSuccess("✓ התבנית השבועית נשמרה בהצלחה!");
    setSaving(false);
  }

  // ── Override save ──────────────────────────────────────────────────────────
  async function handleOverrideSave(e: React.FormEvent) {
    e.preventDefault();
    if (!businessId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    const hasOpenTime = Boolean(overrideForm.open_time);
    const hasCloseTime = Boolean(overrideForm.close_time);
    if (
      hasOpenTime !== hasCloseTime ||
      (hasOpenTime && overrideForm.open_time === overrideForm.close_time)
    ) {
      setError("יש להזין שעת פתיחה ושעת סגירה שונות, או להשאיר את שתיהן ריקות כדי לסמן שהעסק סגור היום.");
      setSaving(false);
      return;
    }

    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });
    const { data, error: err } = await supabase
      .from("business_schedules")
      .upsert({
        business_id: businessId,
        date: todayStr,
        address: overrideForm.address || null,
        lat: overrideForm.lat ? parseFloat(overrideForm.lat) : null,
        lng: overrideForm.lng ? parseFloat(overrideForm.lng) : null,
        open_time: overrideForm.open_time || null,
        close_time: overrideForm.close_time || null,
        note: overrideForm.note || null,
      }, { onConflict: "business_id,date" })
      .select()
      .single();

    if (err) setError("שגיאה בשמירה. נסו שוב.");
    else { setSchedule(data); setSuccess("✓ לוח הזמנים להיום פורסם!"); }
    setSaving(false);
  }

  async function handleOverrideDelete() {
    if (!schedule) return;
    await supabase.from("business_schedules").delete().eq("id", schedule.id);
    setSchedule(null);
    setOverrideForm({ address: "", lat: "", lng: "", open_time: "", close_time: "", note: "" });
    setSuccess("✓ תיקון היומי הוסר — יוצג לפי התבנית השבועית");
  }

  // ── Address helpers ────────────────────────────────────────────────────────
  function onWeeklyPlaceChanged(dow: number) {
    const ac = weeklyAutocompletes.current[dow];
    if (!ac) return;
    const place = ac.getPlace();
    if (place.formatted_address) {
      setWeeklyForms((prev) => ({
        ...prev,
        [dow]: {
          ...prev[dow],
          address: place.formatted_address!,
          lat: place.geometry?.location?.lat().toString() ?? "",
          lng: place.geometry?.location?.lng().toString() ?? "",
        },
      }));
    }
  }

  function onOverridePlaceChanged() {
    if (!autocomplete) return;
    const place = autocomplete.getPlace();
    if (place.formatted_address) {
      setOverrideForm((prev) => ({
        ...prev,
        address: place.formatted_address!,
        lat: place.geometry?.location?.lat().toString() ?? "",
        lng: place.geometry?.location?.lng().toString() ?? "",
      }));
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 rounded-full border-4 border-emerald-200 border-t-[#2D6A4F] animate-spin" />
    </div>
  );

  if (!businessId) return (
    <div className="brand-panel p-8 text-center" dir="rtl">
      <p className="text-stone-600 mb-4">יש ליצור פרופיל עסק תחילה</p>
      <a href="/dashboard/profile" className="text-[#2D6A4F] font-medium hover:underline">עריכת פרופיל ←</a>
    </div>
  );

  return (
    <div className="space-y-5" dir="rtl">
      {/* Tabs */}
      <div className="brand-panel-soft flex w-full gap-1 p-1 sm:w-fit">
        {([
          { key: "weekly", label: "תבנית שבועית", icon: CalendarDays },
          { key: "override", label: "תיקון להיום", icon: MapPinned },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setSuccess(null); setError(null); }}
            className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all sm:flex-none ${
              tab === key ? "bg-white text-[#2D6A4F] shadow-sm" : "text-stone-500 hover:text-stone-700"
            }`}
            aria-pressed={tab === key}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {/* ── WEEKLY TEMPLATE ─────────────────────────────────────────────────── */}
      {tab === "weekly" && (
        <div className="brand-panel bg-[#FFFDF7] p-4 sm:p-6" data-tour="schedule-template">
          <h1 className="font-bold text-xl text-stone-900 mb-1">תבנית שבועית</h1>
          <p className="text-stone-500 text-sm mb-6">הגדירו את ימי ושעות הפעילות הקבועים שלכם. שעת סגירה מוקדמת משעת הפתיחה מסמנת פעילות שחוצה חצות. ניתן לשנות יום ספציפי בטאב &quot;תיקון להיום&quot;.</p>

          <div className="space-y-3">
            {DAYS.map(({ dow, label }) => {
              const f = weeklyForms[dow];
              return (
                <div key={dow} className={`rounded-xl border transition-all ${f.is_active ? "border-[#2D6A4F]/30 bg-[#EFF5F0]/40" : "border-stone-100 bg-stone-50/50"}`}>
                  {/* Day header row */}
                  <div className="flex flex-wrap items-center gap-2 p-3 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => setWeeklyForms((p) => ({ ...p, [dow]: { ...p[dow], is_active: !p[dow].is_active } }))}
                      className="flex h-11 w-12 flex-shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F]"
                      role="switch"
                      aria-checked={f.is_active}
                      aria-label={`הפעלת יום ${label}`}
                    >
                      <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${f.is_active ? "bg-[#2D6A4F]" : "bg-stone-300"}`}>
                        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${f.is_active ? "ltr:translate-x-[22px] rtl:-translate-x-[22px]" : "ltr:translate-x-[2px] rtl:-translate-x-[2px]"}`} />
                      </span>
                    </button>
                    <span className={`min-w-14 font-bold text-sm ${f.is_active ? "text-stone-800" : "text-stone-400"}`}>{label}</span>

                    {f.is_active && (
                      <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:ms-auto sm:w-auto">
                        <label className="sr-only" htmlFor={`open-time-${dow}`}>שעת פתיחה ביום {label}</label>
                        <input
                          id={`open-time-${dow}`}
                          type="time"
                          value={f.open_time}
                          onChange={(e) => setWeeklyForms((p) => ({ ...p, [dow]: { ...p[dow], open_time: e.target.value } }))}
                          className="brand-control h-11 min-w-0 w-full rounded-xl px-2 text-sm focus:outline-none sm:w-[110px]"
                          dir="ltr"
                        />
                        <span className="text-stone-400 text-sm">—</span>
                        <label className="sr-only" htmlFor={`close-time-${dow}`}>שעת סגירה ביום {label}</label>
                        <input
                          id={`close-time-${dow}`}
                          type="time"
                          value={f.close_time}
                          onChange={(e) => setWeeklyForms((p) => ({ ...p, [dow]: { ...p[dow], close_time: e.target.value } }))}
                          className="brand-control h-11 min-w-0 w-full rounded-xl px-2 text-sm focus:outline-none sm:w-[110px]"
                          dir="ltr"
                        />
                      </div>
                    )}
                    {!f.is_active && <span className="text-stone-400 text-xs">לא פעיל</span>}
                  </div>

                  {/* Address + note (expanded when active) */}
                  {f.is_active && (
                    <div className="px-3 pb-3 space-y-2 border-t border-stone-100 pt-2">
                      {isLoaded ? (
                        <Autocomplete
                          onLoad={(ac) => { weeklyAutocompletes.current[dow] = ac; }}
                          onPlaceChanged={() => onWeeklyPlaceChanged(dow)}
                          options={{ componentRestrictions: { country: "il" }, fields: ["formatted_address", "geometry"] }}
                        >
                          <input
                            id={`weekly-address-${dow}`}
                            type="text"
                            value={f.address}
                            onChange={(e) => setWeeklyForms((p) => ({ ...p, [dow]: { ...p[dow], address: e.target.value } }))}
                            placeholder="כתובת קבועה ליום זה (אופציונלי)"
                            className="brand-control w-full h-11 rounded-xl px-3 text-sm"
                            aria-label={`כתובת קבועה ביום ${label}`}
                          />
                        </Autocomplete>
                      ) : (
                        <input type="text" disabled placeholder="טוען..." className="w-full h-11 rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm" aria-label={`טעינת כתובת ביום ${label}`} />
                      )}
                      <input
                        id={`weekly-note-${dow}`}
                        type="text"
                        value={f.note}
                        onChange={(e) => setWeeklyForms((p) => ({ ...p, [dow]: { ...p[dow], note: e.target.value } }))}
                        placeholder="הערה קבועה (אופציונלי)"
                        className="brand-control w-full h-11 rounded-xl px-3 text-sm"
                        aria-label={`הערה קבועה ביום ${label}`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
          {success && <p className="text-emerald-600 text-sm font-medium mt-4">{success}</p>}

          <Button
            onClick={handleWeeklySave}
            disabled={saving}
            className="w-full h-11 rounded-xl bg-[#2D6A4F] hover:bg-[#1F5038] text-white font-semibold mt-5"
          >
            {saving ? "...שומר" : "שמירת התבנית השבועית"}
          </Button>
        </div>
      )}

      {/* ── DAILY OVERRIDE ──────────────────────────────────────────────────── */}
      {tab === "override" && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-1">
            <h1 className="font-bold text-xl text-stone-900">תיקון להיום</h1>
            {schedule && (
              <button onClick={handleOverrideDelete} className="text-xs text-red-500 hover:text-red-700 font-medium">
                הסר תיקון
              </button>
            )}
          </div>
          <p className="text-stone-500 text-sm mb-6">
            {today} — משנה רק להיום, מחר יחזור לתבנית השבועית.
          </p>
          <p className="mb-5 rounded-xl border border-[#D9B44A]/40 bg-[#FFF8DC] px-3 py-2 text-sm text-[#72540C]">
            כדי לסמן שהעסק סגור היום, השאירו את שתי השעות ריקות ושמרו. פעילות אחרי חצות נתמכת.
          </p>

          {!schedule && (
            <div className="bg-[#EFF5F0] border border-[#DDEBE0] rounded-xl p-3 mb-5 text-sm text-[#1F5038]">
              💡 אין תיקון להיום — מוצג לפי התבנית השבועית. מלאו פרטים רק אם צריך לשנות משהו.
            </div>
          )}

          <form onSubmit={handleOverrideSave} className="space-y-5">
            <div>
              <Label className="block text-stone-700 font-medium text-sm mb-1.5">כתובת מיקום היום</Label>
              {isLoaded ? (
                <Autocomplete
                  onLoad={(ac) => setAutocomplete(ac)}
                  onPlaceChanged={onOverridePlaceChanged}
                  options={{ componentRestrictions: { country: "il" }, fields: ["formatted_address", "geometry"] }}
                >
                  <input
                    type="text"
                    value={overrideForm.address}
                    onChange={(e) => setOverrideForm((p) => ({ ...p, address: e.target.value }))}
                    placeholder="הקלידו כתובת..."
                    className="w-full h-11 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] px-4 text-sm"
                  />
                </Autocomplete>
              ) : (
                <input type="text" disabled placeholder="טוען מפות..." className="w-full h-11 rounded-xl border border-stone-200 bg-stone-50 px-4 text-sm cursor-not-allowed" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="block text-stone-700 font-medium text-sm mb-1.5">שעת פתיחה</Label>
                <Input type="time" value={overrideForm.open_time}
                  onChange={(e) => setOverrideForm((p) => ({ ...p, open_time: e.target.value }))}
                  className="h-11 rounded-xl border-stone-200 focus-visible:ring-[#2D6A4F]" dir="ltr" />
              </div>
              <div>
                <Label className="block text-stone-700 font-medium text-sm mb-1.5">שעת סגירה</Label>
                <Input type="time" value={overrideForm.close_time}
                  onChange={(e) => setOverrideForm((p) => ({ ...p, close_time: e.target.value }))}
                  className="h-11 rounded-xl border-stone-200 focus-visible:ring-[#2D6A4F]" dir="ltr" />
              </div>
            </div>

            <div>
              <Label className="block text-stone-700 font-medium text-sm mb-1.5">הערה להיום (אופציונלי)</Label>
              <Textarea
                value={overrideForm.note}
                onChange={(e) => setOverrideForm((p) => ({ ...p, note: e.target.value }))}
                placeholder="למשל: היום יש מבצע מיוחד..."
                rows={2}
                className="rounded-xl border-stone-200 focus-visible:ring-[#2D6A4F] resize-none"
              />
            </div>

            {error && <p role="alert" className="text-red-600 text-sm">{error}</p>}
            {success && <p className="text-emerald-600 text-sm font-medium">{success}</p>}

            <Button type="submit" disabled={saving}
              className="w-full h-11 rounded-xl bg-[#2D6A4F] hover:bg-[#1F5038] text-white font-semibold">
              {saving ? "...שומר" : schedule ? "עדכון תיקון להיום" : "פרסום תיקון להיום"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
