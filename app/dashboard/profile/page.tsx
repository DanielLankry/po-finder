"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
import { BadgeCheck, Beef, CakeSlice, Coffee, Eye, Flower2, Gem, Leaf, MapPin, MessageCircle, Phone, Shirt, UtensilsCrossed, Wheat } from "lucide-react";

const CATEGORY_ICONS: Record<BusinessCategory, React.ComponentType<{ className?: string }>> = {
  coffee: Coffee,
  food: UtensilsCrossed,
  sweets: CakeSlice,
  meat: Beef,
  vegan: Leaf,
  celiac: Wheat,
  flowers: Flower2,
  jewelry: Gem,
  vintage: Shirt,
};

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
    category: "food" as BusinessCategory,
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
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

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

      // Validate website URL (prevent javascript: and other unsafe schemes)
      if (form.website) {
        try {
          const url = new URL(form.website);
          if (!["http:", "https:"].includes(url.protocol)) {
            throw new Error("URL לא תקין");
          }
        } catch {
          throw new Error("כתובת האתר אינה תקינה — השתמשו בפורמט https://...");
        }
      }

      const payload = {
        name: form.name.trim().slice(0, 100),
        description: form.description?.trim().slice(0, 500) || null,
        category: form.category,
        kashrut: form.kashrut,
        phone: form.phone.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        website: form.website.trim() || null,
        instagram: form.instagram.replace(/^@/, "").trim() || null,
        business_number: form.business_number.trim() || null,
        address: form.address || null,
        lat: form.lat,
        lng: form.lng,
      };

      if (business) {
        const { error: updateError } = await supabase
          .from("businesses")
          .update(payload)
          .eq("id", business.id);
        if (updateError) throw updateError;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("businesses")
          .insert({ owner_id: user.id, is_active: false, ...payload })
          .select()
          .single();
        if (insertError) throw insertError;
        // Update local state so next save does UPDATE not INSERT
        if (inserted) setBusiness(inserted);
      }
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message;
      setError(`שגיאה בשמירת הפרטים: ${msg ?? "נסו שוב"}`);
      console.error("Supabase save error:", err);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-4 border-[#C3DCC9] border-t-[#2D6A4F] animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]" dir="rtl">
      <div className="brand-panel p-6">
      <h1 className="font-display font-bold text-xl text-stone-900 mb-6">
        {business ? "עריכת פרטי העסק" : "יצירת פרופיל עסק"}
      </h1>
      <p className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        זו טיוטה פרטית בחינם. היא תופיע לציבור רק אחרי אימות העסק ותשלום על רישום פעיל.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div data-tour="profile-name">
          <FormField label="שם העסק" htmlFor="business-name" required>
            <Input
              id="business-name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="קפה של דני"
              required
              maxLength={100}
              className="h-11 rounded-xl border-stone-200 focus-visible:ring-[#2D6A4F]"
            />
          </FormField>
        </div>

        <FormField label="תיאור" htmlFor="business-description">
          <Textarea
            id="business-description"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="ספרו על העסק שלכם..."
            rows={3}
            maxLength={500}
            className="rounded-xl border-stone-200 focus-visible:ring-[#2D6A4F] resize-none"
          />
        </FormField>

        <div data-tour="profile-address">
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
          <FormField label="סוג העסק" required>
            <div className="col-span-full flex gap-2.5 overflow-x-auto px-1 pb-2 pt-1 scrollbar-hide sm:flex-wrap" role="group" aria-label="בחירת סוג העסק">
              {(Object.keys(CATEGORY_LABELS) as BusinessCategory[]).map((category, index) => {
                const Icon = CATEGORY_ICONS[category];
                return (
                  <button
                    key={category}
                    type="button"
                    aria-pressed={form.category === category}
                    data-active={form.category === category}
                    onClick={() => update("category", category)}
                    className="business-type-button flex shrink-0 items-center gap-2 px-4 py-2.5"
                    style={{ "--pill-delay": `${Math.min(index * 18, 140)}ms` } as React.CSSProperties}
                  >
                    <span className="business-type-icon" aria-hidden="true"><Icon className="h-4 w-4" /></span>
                    <span className="text-sm font-bold">{CATEGORY_LABELS[category]}</span>
                  </button>
                );
              })}
            </div>
          </FormField>
          </div>

          <FormField label="כשרות" htmlFor="business-kashrut">
            <Select
              value={form.kashrut}
              onValueChange={(v) => update("kashrut", v)}
            >
              <SelectTrigger id="business-kashrut" className="h-11 rounded-xl border-stone-200 focus:ring-[#2D6A4F]">
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
          <FormField label="טלפון" htmlFor="business-phone">
            <Input
              id="business-phone"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="05X-XXXXXXX"
              type="tel"
              className="h-11 rounded-xl border-stone-200 focus-visible:ring-[#2D6A4F]"
              dir="ltr"
            />
          </FormField>

          <FormField label="WhatsApp" htmlFor="business-whatsapp">
            <Input
              id="business-whatsapp"
              value={form.whatsapp}
              onChange={(e) => update("whatsapp", e.target.value)}
              placeholder="972XXXXXXXXX"
              type="tel"
              className="h-11 rounded-xl border-stone-200 focus-visible:ring-[#2D6A4F]"
              dir="ltr"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="אינסטגרם" htmlFor="business-instagram">
            <div className="relative">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">@</span>
              <Input
                id="business-instagram"
                value={form.instagram}
                onChange={(e) => update("instagram", e.target.value)}
                placeholder="username"
                className="h-11 rounded-xl border-stone-200 focus-visible:ring-[#2D6A4F] pr-8"
                dir="ltr"
              />
            </div>
          </FormField>

          <FormField label="אתר אינטרנט" htmlFor="business-website">
            <Input
              id="business-website"
              value={form.website}
              onChange={(e) => update("website", e.target.value)}
              placeholder="https://..."
              type="url"
              className="h-11 rounded-xl border-stone-200 focus-visible:ring-[#2D6A4F]"
              dir="ltr"
            />
          </FormField>
        </div>

        <FormField label="מספר עוסק (ח.פ. / ע.מ.)" htmlFor="business-number" hint="הצגת תג 'עסק מאומת' על המפה">
          <Input
            id="business-number"
            value={form.business_number}
            onChange={(e) => update("business_number", e.target.value)}
            placeholder="אופציונלי"
            className="h-11 rounded-xl border-stone-200 focus-visible:ring-[#2D6A4F]"
            dir="ltr"
          />
        </FormField>

        {error && <p role="alert" className="text-red-600 text-sm">{error}</p>}
        {success && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <span className="flex items-center gap-2 font-medium"><BadgeCheck className="h-4 w-4" aria-hidden="true" /> הטיוטה נשמרה בהצלחה</span>
            <Link href="/dashboard/billing" className="font-bold underline">לבחירת תקופה ותשלום</Link>
          </div>
        )}

        <Button
          type="submit"
          disabled={saving}
          data-tour="profile-save"
          className="w-full h-11 rounded-xl bg-[#2D6A4F] hover:bg-[#1F5038] text-white font-medium"
        >
          {saving ? "...שומר" : business ? "שמירת שינויים" : "יצירת עסק"}
        </Button>
      </form>
      </div>

      <aside className="brand-panel-orange sticky top-24 overflow-hidden p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-[#8A3618]" />
            <p className="font-bold text-[#8A3618]">תצוגה מקדימה</p>
          </div>
          <span className="rounded-full border border-[#8A3618] bg-white px-2.5 py-1 text-[10px] font-bold text-[#8A3618]">טיוטה פרטית</span>
        </div>
        <div className="overflow-hidden rounded-2xl border-2 border-[#17402D] bg-[#FFFDF7] shadow-[4px_4px_0_0_#17402D]">
          <div className="flex h-36 items-center justify-center bg-[linear-gradient(135deg,#DDEBE0,#FFF3B0)]">
            <span className="font-display text-6xl text-[#17402D]">{form.name.trim().slice(0, 1) || "פ"}</span>
          </div>
          <div className="space-y-3 p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-display text-3xl leading-none text-stone-950">{form.name.trim() || "שם העסק"}</h2>
                <p className="mt-1 text-xs font-bold text-[#2D6A4F]">{CATEGORY_LABELS[form.category]}</p>
              </div>
              {business?.is_verified ? <BadgeCheck className="h-5 w-5 shrink-0 text-[#2D6A4F]" aria-label="עסק מאומת" /> : null}
            </div>
            <p className="min-h-10 text-sm leading-relaxed text-stone-600">{form.description.trim() || "התיאור שתכתבו יופיע כאן."}</p>
            {form.address ? <p className="flex items-center gap-2 text-xs text-stone-600"><MapPin className="h-3.5 w-3.5 text-[#C4552D]" />{form.address}</p> : null}
            {form.phone ? <p className="flex items-center gap-2 text-xs text-stone-600" dir="ltr"><Phone className="h-3.5 w-3.5 text-[#2D6A4F]" />{form.phone}</p> : null}
            {form.whatsapp ? <p className="flex items-center gap-2 text-xs text-stone-600" dir="ltr"><MessageCircle className="h-3.5 w-3.5 text-[#2D6A4F]" />WhatsApp {form.whatsapp}</p> : null}
          </div>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-stone-600">אפשר לערוך ולצפות בטיוטה בלי לשלם. אחרי אימות, בוחרים משך הופעה ורק אז הכרטיס נכנס למפה ולרשימה.</p>
      </aside>
    </div>
  );
}

function FormField({
  label,
  hint,
  required,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor} className="block text-stone-700 font-medium text-sm mb-1.5">
        {label}
        {required && <span className="text-red-500 me-1"> *</span>}
      </Label>
      {hint && <p className="text-stone-400 text-xs mb-1.5">{hint}</p>}
      {children}
    </div>
  );
}
