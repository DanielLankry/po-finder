"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Business, BusinessCategory, KashrutStatus } from "@/lib/types";
import { CATEGORY_LABELS, KASHRUT_LABELS } from "@/lib/types";
import PlacesSearchBar from "@/components/map/PlacesSearchBar";
import type { LocationResult } from "@/components/map/PlacesSearchBar";
import { MapPin } from "lucide-react";

export default function ProfilePage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "coffee" as BusinessCategory,
    kashrut: "none" as KashrutStatus,
    phone: "",
    whatsapp: "",
    website: "",
    instagram: "",
    business_number: "",
    address: "",
    lat: null as number | null,
    lng: null as number | null,
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", user.id)
        .single();

      if (data) {
        setBusiness(data);
        setForm({
          name: data.name ?? "",
          description: data.description ?? "",
          category: data.category ?? "coffee",
          kashrut: data.kashrut ?? "none",
          phone: data.phone ?? "",
          whatsapp: data.whatsapp ?? "",
          website: data.website ?? "",
          instagram: data.instagram ?? "",
          business_number: data.business_number ?? "",
          address: data.address ?? "",
          lat: data.lat ?? null,
          lng: data.lng ?? null,
        });
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const payload = {
        name: form.name,
        description: form.description || null,
        category: form.category,
        kashrut: form.kashrut,
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        website: form.website || null,
        instagram: form.instagram || null,
        business_number: form.business_number || null,
        address: form.address || null,
        lat: form.lat,
        lng: form.lng,
      };

      if (business) {
        await supabase
          .from("businesses")
          .update(payload)
          .eq("id", business.id);
      } else {
        await supabase.from("businesses").insert({
          owner_id: user.id,
          ...payload,
        });
      }
      setSuccess(true);
    } catch {
      setError("שגיאה בשמירת הפרטים. נסו שוב.");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-card" dir="rtl">
      <h1 className="font-display font-bold text-xl text-stone-900 mb-6">
        {business ? "עריכת פרטי העסק" : "יצירת פרופיל עסק"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <FormField label="שם העסק" required>
          <Input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="קפה של דני"
            required
            className="h-11 rounded-xl border-stone-200 focus-visible:ring-blue-600"
          />
        </FormField>

        <FormField label="תיאור">
          <Textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="ספרו על העסק שלכם..."
            rows={3}
            className="rounded-xl border-stone-200 focus-visible:ring-blue-600 resize-none"
          />
        </FormField>

        <FormField label="כתובת העסק" hint="חפשו כתובת או בחרו מיקום מהמפה">
          <PlacesSearchBar
            onLocationSelect={(loc: LocationResult) => {
              setForm((prev) => ({
                ...prev,
                address: loc.name,
                lat: loc.lat,
                lng: loc.lng,
              }));
              setSuccess(false);
            }}
            placeholder="חפשו כתובת..."
          />
          {form.address && (
            <div className="mt-2 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
              <MapPin className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span>{form.address}</span>
            </div>
          )}
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="קטגוריה" required>
            <Select
              value={form.category}
              onValueChange={(v) => update("category", v)}
            >
              <SelectTrigger className="h-11 rounded-xl border-stone-200 focus:ring-blue-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CATEGORY_LABELS) as BusinessCategory[]).map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="כשרות">
            <Select
              value={form.kashrut}
              onValueChange={(v) => update("kashrut", v)}
            >
              <SelectTrigger className="h-11 rounded-xl border-stone-200 focus:ring-blue-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(KASHRUT_LABELS) as KashrutStatus[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {KASHRUT_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="טלפון">
            <Input
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="05X-XXXXXXX"
              type="tel"
              className="h-11 rounded-xl border-stone-200 focus-visible:ring-blue-600"
              dir="ltr"
            />
          </FormField>

          <FormField label="WhatsApp">
            <Input
              value={form.whatsapp}
              onChange={(e) => update("whatsapp", e.target.value)}
              placeholder="972XXXXXXXXX"
              type="tel"
              className="h-11 rounded-xl border-stone-200 focus-visible:ring-blue-600"
              dir="ltr"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="אינסטגרם">
            <div className="relative">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">@</span>
              <Input
                value={form.instagram}
                onChange={(e) => update("instagram", e.target.value)}
                placeholder="username"
                className="h-11 rounded-xl border-stone-200 focus-visible:ring-blue-600 pr-8"
                dir="ltr"
              />
            </div>
          </FormField>

          <FormField label="אתר אינטרנט">
            <Input
              value={form.website}
              onChange={(e) => update("website", e.target.value)}
              placeholder="https://..."
              type="url"
              className="h-11 rounded-xl border-stone-200 focus-visible:ring-blue-600"
              dir="ltr"
            />
          </FormField>
        </div>

        <FormField label="מספר עוסק (ח.פ. / ע.מ.)" hint="הצגת תג 'עסק מאומת' על המפה">
          <Input
            value={form.business_number}
            onChange={(e) => update("business_number", e.target.value)}
            placeholder="אופציונלי"
            className="h-11 rounded-xl border-stone-200 focus-visible:ring-blue-600"
            dir="ltr"
          />
        </FormField>

        {error && <p role="alert" className="text-red-600 text-sm">{error}</p>}
        {success && (
          <p className="text-emerald-600 text-sm font-medium">
            ✓ הפרטים נשמרו בהצלחה
          </p>
        )}

        <Button
          type="submit"
          disabled={saving}
          className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium"
        >
          {saving ? "...שומר" : business ? "שמירת שינויים" : "יצירת עסק"}
        </Button>
      </form>
    </div>
  );
}

function FormField({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="block text-stone-700 font-medium text-sm mb-1.5">
        {label}
        {required && <span className="text-red-500 me-1"> *</span>}
      </Label>
      {hint && <p className="text-stone-400 text-xs mb-1.5">{hint}</p>}
      {children}
    </div>
  );
}
