"use client";

import { Suspense } from "react";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CATEGORY_LABELS } from "@/lib/types";
import { CheckCircle, XCircle, ExternalLink, Phone, Mail } from "lucide-react";

interface PendingBusiness {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  category: string;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  instagram: string | null;
  kashrut: string;
  business_number: string | null;
  created_at: string;
}

function AdminBusinessesPageInner() {
  const params = useSearchParams();
  const secret = params.get("secret") ?? "";
  const [businesses, setBusinesses] = useState<PendingBusiness[]>([]);
  const [ownerEmails, setOwnerEmails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPending = useCallback(async () => {
    if (!secret) { setError("Missing secret"); setLoading(false); return; }
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("businesses")
      .select("*")
      .eq("is_active", false)
      .order("created_at", { ascending: false });

    if (err) { setError(err.message); setLoading(false); return; }
    setBusinesses(data ?? []);
    setLoading(false);
  }, [secret]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  async function approve(businessId: string) {
    const res = await fetch("/api/admin/businesses/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, secret }),
    });
    const json = await res.json();
    if (json.ok) setBusinesses((prev) => prev.filter((b) => b.id !== businessId));
    else alert("Error: " + json.error);
  }

  async function reject(businessId: string) {
    const supabase = createClient();
    await supabase.from("businesses").delete().eq("id", businessId);
    setBusinesses((prev) => prev.filter((b) => b.id !== businessId));
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-10 w-10 rounded-full border-4 border-emerald-200 border-t-[#059669] animate-spin" />
    </div>
  );
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-[#FAFAF7] p-8" dir="rtl">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-[#111]">אישור עסקים</h1>
            <p className="text-[#888] text-sm">{businesses.length} ממתינים לאישור</p>
          </div>
          <a
            href={`/admin/spots?secret=${secret}`}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700 text-sm font-semibold hover:bg-orange-200 transition-colors"
          >
            ✦ Spots
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {businesses.length === 0 && (
          <div className="text-center py-16 text-[#AAA]">אין עסקים ממתינים לאישור 🎉</div>
        )}

        <div className="flex flex-col gap-4">
          {businesses.map((biz) => (
            <div key={biz.id} className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  {/* Badges */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="bg-[#059669] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {CATEGORY_LABELS[biz.category as keyof typeof CATEGORY_LABELS] ?? biz.category}
                    </span>
                    {biz.kashrut !== "none" && (
                      <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                        {biz.kashrut === "kosher" ? "כשר" : "כשר למהדרין"}
                      </span>
                    )}
                  </div>

                  <h2 className="font-bold text-[#111] text-lg">{biz.name}</h2>
                  {biz.description && <p className="text-[#666] text-sm mt-1 mb-2">{biz.description}</p>}

                  <div className="flex flex-wrap gap-3 text-sm text-[#555] mt-2">
                    {biz.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />{biz.phone}
                      </span>
                    )}
                    {biz.business_number && (
                      <span className="text-[#888]">עוסק: {biz.business_number}</span>
                    )}
                    {biz.website && (
                      <a href={biz.website} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline">
                        <ExternalLink className="h-3.5 w-3.5" />אתר
                      </a>
                    )}
                    {biz.instagram && (
                      <span className="text-pink-600">@{biz.instagram}</span>
                    )}
                  </div>

                  <div className="text-[#AAA] text-xs mt-2 space-y-0.5">
                    <p>owner_id: {biz.owner_id}</p>
                    <p>נוצר: {new Date(biz.created_at).toLocaleString("he-IL")}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-4 pt-4 border-t border-[#F5F5F5]">
                <button
                  onClick={() => approve(biz.id)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#059669] text-white font-semibold text-sm hover:bg-[#047857] transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />
                  אשר ופרסם
                </button>
                <button
                  onClick={() => reject(biz.id)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-100 text-red-700 font-semibold text-sm hover:bg-red-200 transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                  דחה ומחק
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminBusinessesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 rounded-full border-4 border-[#D1FAE5] border-t-[#059669] animate-spin" /></div>}>
      <AdminBusinessesPageInner />
    </Suspense>
  );
}
