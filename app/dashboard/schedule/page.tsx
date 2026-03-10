"use client";

import { useState, useEffect, useRef } from "react";
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { BusinessSchedule } from "@/lib/types";

const LIBRARIES: ("places")[] = ["places"];

export default function SchedulePage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<BusinessSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const supabase = createClient();

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: LIBRARIES,
    language: "he",
    region: "IL",
  });

  const [form, setForm] = useState({
    address: "",
    lat: "",
    lng: "",
    open_time: "",
    close_time: "",
    note: "",
  });

  const today = new Date().toLocaleDateString("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jerusalem",
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: biz } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (!biz) { setLoading(false); return; }
      setBusinessId(biz.id);

      const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });
      const { data: sch } = await supabase
        .from("business_schedules")
        .select("*")
        .eq("business_id", biz.id)
        .eq("date", today)
        .maybeSingle();

      if (sch) {
        setSchedule(sch);
        setForm({
          address: sch.address ?? "",
          lat: sch.lat?.toString() ?? "",
          lng: sch.lng?.toString() ?? "",
          open_time: sch.open_time ?? "",
          close_time: sch.close_time ?? "",
          note: sch.note ?? "",
        });
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  const onLoad = (autoC: google.maps.places.Autocomplete) => setAutocomplete(autoC);

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.formatted_address) {
        setForm((prev) => ({
          ...prev,
          address: place.formatted_address!,
          lat: place.geometry?.location?.lat().toString() ?? "",
          lng: place.geometry?.location?.lng().toString() ?? "",
        }));
        setSuccess(false);
      }
    } else {
      console.log("Autocomplete is not loaded yet!");
    }
  };

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!businessId) return;
    setSaving(true);
    setError(null);

    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });

    const upsertData = {
      business_id: businessId,
      date: today,
      address: form.address || null,
      lat: form.lat ? parseFloat(form.lat) : null,
      lng: form.lng ? parseFloat(form.lng) : null,
      open_time: form.open_time || null,
      close_time: form.close_time || null,
      note: form.note || null,
    };

    const { data, error: err } = await supabase
      .from("business_schedules")
      .upsert(upsertData, { onConflict: "business_id,date" })
      .select()
      .single();

    if (err) {
      setError("שגיאה בשמירת לוח הזמנים. נסו שוב.");
    } else {
      setSchedule(data);
      setSuccess(true);
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!schedule) return;
    const { error: delError } = await supabase
      .from("business_schedules")
      .delete()
      .eq("id", schedule.id);
    if (delError) {
      setError(`שגיאה במחיקה: ${delError.message}`);
      return;
    }
    setSchedule(null);
    setForm({ address: "", lat: "", lng: "", open_time: "", close_time: "", note: "" });
    setSuccess(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  if (!businessId) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center shadow-card" dir="rtl">
        <p className="text-stone-600 mb-4">יש ליצור פרופיל עסק תחילה</p>
        <a href="/dashboard/profile" className="text-blue-600 font-medium hover:underline">
          עריכת פרופיל ←
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-card">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-display font-bold text-xl text-stone-900">
            לוח זמנים להיום
          </h1>
          {schedule && (
            <button
              onClick={handleDelete}
              className="text-xs text-red-500 hover:text-red-700 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
            >
              מחיקה
            </button>
          )}
        </div>
        <p className="text-stone-500 text-sm mb-6">{today}</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Address with Places Autocomplete */}
          <div>
            <Label className="block text-stone-700 font-medium text-sm mb-1.5">
              כתובת מיקום היום
            </Label>
            {isLoaded ? (
              <Autocomplete
                onLoad={onLoad}
                onPlaceChanged={onPlaceChanged}
                options={{ componentRestrictions: { country: "il" }, fields: ["formatted_address", "geometry"] }}
              >
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  placeholder="הקלידו כתובת..."
                  className="w-full h-11 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#059669] px-4 text-sm text-stone-700 placeholder:text-stone-400"
                />
              </Autocomplete>
            ) : (
               <input
                 type="text"
                 disabled
                 placeholder="טוען מפות..."
                 className="w-full h-11 rounded-xl border border-stone-200 bg-stone-50 px-4 text-sm text-stone-400 cursor-not-allowed"
               />
            )}
          </div>

          {/* Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="block text-stone-700 font-medium text-sm mb-1.5">
                שעת פתיחה
              </Label>
              <Input
                type="time"
                value={form.open_time}
                onChange={(e) => update("open_time", e.target.value)}
                className="h-11 rounded-xl border-stone-200 focus-visible:ring-[#059669]"
                dir="ltr"
              />
            </div>
            <div>
              <Label className="block text-stone-700 font-medium text-sm mb-1.5">
                שעת סגירה
              </Label>
              <Input
                type="time"
                value={form.close_time}
                onChange={(e) => update("close_time", e.target.value)}
                className="h-11 rounded-xl border-stone-200 focus-visible:ring-[#059669]"
                dir="ltr"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <Label className="block text-stone-700 font-medium text-sm mb-1.5">
              הערה להיום (אופציונלי)
            </Label>
            <Textarea
              value={form.note}
              onChange={(e) => update("note", e.target.value)}
              placeholder="למשל: היום יש מבצע מיוחד..."
              rows={2}
              className="rounded-xl border-stone-200 focus-visible:ring-blue-600 resize-none"
            />
          </div>

          {error && <p role="alert" className="text-red-600 text-sm">{error}</p>}
          {success && (
            <p className="text-emerald-600 text-sm font-medium">
              ✓ לוח הזמנים פורסם בהצלחה! תופיעו על המפה.
            </p>
          )}

          <Button
            type="submit"
            disabled={saving}
            className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            {saving ? "...שומר" : schedule ? "עדכון לוח זמנים" : "פרסום לוח זמנים"}
          </Button>
        </form>
      </div>
    </div>
  );
}
