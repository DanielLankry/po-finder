"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, X, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Photo } from "@/lib/types";

export default function PhotosPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: biz } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!biz) { setLoading(false); return; }
      setBusinessId(biz.id);

      const { data: ph } = await supabase
        .from("photos")
        .select("*")
        .eq("business_id", biz.id)
        .order("is_primary", { ascending: false });

      setPhotos(ph ?? []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function uploadFiles(files: FileList | File[]) {
    if (!businessId) return;
    setUploading(true);
    setUploadError(null);

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setUploadError(`סוג קובץ לא נתמך: ${file.name}`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        setUploadError(`הקובץ ${file.name} גדול מ-10MB`);
        continue;
      }

      const ext = file.name.split(".").pop() ?? "jpg";
      const fileName = `${businessId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: storageError } = await supabase.storage
        .from("photos")
        .upload(fileName, file, { cacheControl: "3600" });

      if (storageError) {
        setUploadError(`שגיאה בהעלאה: ${storageError.message}`);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage.from("photos").getPublicUrl(fileName);

      const isPrimary = photos.length === 0;
      const { data: photo, error: dbError } = await supabase
        .from("photos")
        .insert({ business_id: businessId, url: publicUrl, is_primary: isPrimary })
        .select()
        .single();

      if (dbError) {
        setUploadError(`שגיאה בשמירת תמונה: ${dbError.message}`);
        // Clean up orphaned storage file
        await supabase.storage.from("photos").remove([fileName]);
        continue;
      }

      if (photo) setPhotos((prev) => [...prev, photo as Photo]);
    }
    setUploading(false);
  }

  async function setPrimary(photoId: string) {
    if (!businessId) return;

    const { error: e1 } = await supabase.from("photos").update({ is_primary: false }).eq("business_id", businessId);
    const { error: e2 } = await supabase.from("photos").update({ is_primary: true }).eq("id", photoId);

    if (e1 || e2) {
      setUploadError("שגיאה בעדכון תמונה ראשית");
      return;
    }
    setPhotos((prev) => prev.map((p) => ({ ...p, is_primary: p.id === photoId })));
  }

  async function deletePhoto(photo: Photo) {
    if (!window.confirm("למחוק את התמונה? לא ניתן לבטל את הפעולה.")) return;

    // Remove the database row first so a transient Storage error cannot leave
    // a broken image reference visible in the owner or public experience.
    const { error: dbError } = await supabase.from("photos").delete().eq("id", photo.id);
    if (dbError) {
      setUploadError(`שגיאה במחיקה: ${dbError.message}`);
      return;
    }

    // Extract storage path from public URL — everything after /object/public/photos/
    const match = photo.url.match(/\/object\/public\/photos\/(.+)$/);
    const filePath = match?.[1];
    if (filePath) {
      const { error: storageError } = await supabase.storage
        .from("photos")
        .remove([decodeURIComponent(filePath)]);
      if (storageError) {
        console.error("Failed to remove orphaned photo object:", storageError);
      }
    }

    const remaining = photos.filter((item) => item.id !== photo.id);
    if (photo.is_primary && remaining[0]) {
      await supabase.from("photos").update({ is_primary: true }).eq("id", remaining[0].id);
      remaining[0] = { ...remaining[0], is_primary: true };
    }
    setPhotos(remaining);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-4 border-[#C3DCC9] border-t-[#2D6A4F] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="brand-panel bg-[#FFFDF7] p-5 sm:p-6">
        <h1 className="font-display font-bold text-xl text-stone-900 mb-2">תמונות</h1>
        <p className="text-stone-500 text-sm mb-6">
          הוסיפו תמונות של העסק. הגדירו תמונה ראשית שתופיע בכרטיס.
        </p>

        {/* Drag & drop zone */}
        <div
          data-tour="photos-upload"
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${
            dragOver
              ? "border-[#2D6A4F] bg-[#EFF5F0]"
              : "border-stone-300 hover:border-[#2D6A4F]/50 hover:bg-[#EFF5F0]/50"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            uploadFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          aria-label="העלאת תמונות — לחצו או גררו"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
        >
          <Upload
            className="h-8 w-8 text-stone-400 mx-auto mb-3"
            aria-hidden="true"
          />
          <p className="text-stone-600 font-medium text-sm">
            גררו תמונות לכאן או לחצו להעלאה
          </p>
          <p className="text-stone-400 text-xs mt-1">PNG, JPG, WEBP עד 10MB</p>
          {uploading && (
            <p className="text-[#2D6A4F] text-sm mt-2 font-medium">...מעלה</p>
          )}
          {uploadError && (
            <p className="text-red-600 text-sm mt-2" role="alert">{uploadError}</p>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          aria-label="בחירת תמונות להעלאה"
        />

        {/* Photo grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group rounded-xl overflow-hidden aspect-square border-2 border-[#17402D]/20 bg-[#EDE8DC]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt="תמונת עסק"
                  className="w-full h-full object-cover"
                />

                {/* Primary badge */}
                {photo.is_primary && (
                  <div className="absolute top-2 right-2 bg-[#2D6A4F] text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Star className="h-3 w-3 fill-white" aria-hidden="true" />
                    ראשית
                  </div>
                )}

                {/* Actions stay visible on touch; pointer devices reveal them on hover. */}
                <div className="absolute inset-x-0 bottom-0 flex min-h-14 items-center justify-center gap-2 bg-gradient-to-t from-black/70 to-transparent p-2 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                  {!photo.is_primary && (
                    <button
                      onClick={() => setPrimary(photo.id)}
                      className="min-h-11 bg-white text-stone-700 text-xs font-bold px-3 py-2 rounded-xl hover:bg-[#EFF5F0] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F]"
                      aria-label="הגדרה כתמונה ראשית"
                    >
                      הגדרה כראשית
                    </button>
                  )}
                  <button
                    onClick={() => deletePhoto(photo)}
                    className="flex h-11 w-11 items-center justify-center bg-white text-red-600 rounded-xl hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    aria-label="מחיקת תמונה"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
