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
        .single();

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
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

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
    // Extract storage path from public URL — everything after /object/public/photos/
    const match = photo.url.match(/\/object\/public\/photos\/(.+)$/);
    const filePath = match?.[1];
    if (filePath) {
      await supabase.storage.from("photos").remove([decodeURIComponent(filePath)]);
    }
    const { error: dbError } = await supabase.from("photos").delete().eq("id", photo.id);
    if (dbError) {
      setUploadError(`שגיאה במחיקה: ${dbError.message}`);
      return;
    }
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-card">
        <h1 className="font-display font-bold text-xl text-stone-900 mb-2">תמונות</h1>
        <p className="text-stone-500 text-sm mb-6">
          הוסיפו תמונות של העסק. הגדירו תמונה ראשית שתופיע בכרטיס.
        </p>

        {/* Drag & drop zone */}
        <div
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${
            dragOver
              ? "border-blue-600 bg-blue-50"
              : "border-stone-300 hover:border-blue-400 hover:bg-blue-50/50"
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
            <p className="text-blue-600 text-sm mt-2 font-medium">...מעלה</p>
          )}
          {uploadError && (
            <p className="text-red-600 text-sm mt-2" role="alert">{uploadError}</p>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          aria-label="בחירת תמונות להעלאה"
        />

        {/* Photo grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group rounded-xl overflow-hidden aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt="תמונת עסק"
                  className="w-full h-full object-cover"
                />

                {/* Primary badge */}
                {photo.is_primary && (
                  <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Star className="h-3 w-3 fill-white" aria-hidden="true" />
                    ראשית
                  </div>
                )}

                {/* Actions on hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!photo.is_primary && (
                    <button
                      onClick={() => setPrimary(photo.id)}
                      className="bg-white text-stone-700 text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-blue-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                      aria-label="הגדרה כתמונה ראשית"
                    >
                      הגדרה כראשית
                    </button>
                  )}
                  <button
                    onClick={() => deletePhoto(photo)}
                    className="bg-white text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    aria-label="מחיקת תמונה"
                  >
                    <X className="h-3.5 w-3.5" />
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
