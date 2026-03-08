"use server";

import { createClient } from "@/lib/supabase/server";
import type { Photo } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function getPhotos(businessId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .eq("business_id", businessId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as Photo[];
}

export async function uploadPhoto(
  businessId: string,
  file: File,
  isPrimary = false
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const ext = file.name.split(".").pop();
  const fileName = `${businessId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("photos")
    .upload(fileName, file, { cacheControl: "3600", upsert: false });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from("photos")
    .getPublicUrl(fileName);

  if (isPrimary) {
    // Unset existing primary
    await supabase
      .from("photos")
      .update({ is_primary: false })
      .eq("business_id", businessId)
      .eq("is_primary", true);
  }

  const { data, error } = await supabase
    .from("photos")
    .insert({ business_id: businessId, url: publicUrl, is_primary: isPrimary })
    .select()
    .single();

  if (error) throw error;
  revalidatePath(`/businesses/${businessId}`);
  revalidatePath("/dashboard/photos");
  return data as Photo;
}

export async function setPrimaryPhoto(photoId: string, businessId: string) {
  const supabase = await createClient();

  // Unset all primaries
  await supabase
    .from("photos")
    .update({ is_primary: false })
    .eq("business_id", businessId);

  // Set new primary
  const { error } = await supabase
    .from("photos")
    .update({ is_primary: true })
    .eq("id", photoId);

  if (error) throw error;
  revalidatePath(`/businesses/${businessId}`);
  revalidatePath("/dashboard/photos");
}

export async function deletePhoto(photoId: string, businessId: string, url: string) {
  const supabase = await createClient();

  // Delete from storage
  const filePath = url.split("/photos/")[1];
  if (filePath) {
    await supabase.storage.from("photos").remove([filePath]);
  }

  const { error } = await supabase
    .from("photos")
    .delete()
    .eq("id", photoId);

  if (error) throw error;
  revalidatePath(`/businesses/${businessId}`);
  revalidatePath("/dashboard/photos");
}
