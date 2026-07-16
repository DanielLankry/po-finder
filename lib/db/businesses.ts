"use server";

import { createClient } from "@/lib/supabase/server";
import type { Business, BusinessCategory, KashrutStatus } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { signPhotoRecords } from "@/lib/storage/photo-urls";
import { getLatestOwnedBusiness, getOwnedBusinesses } from "@/lib/db/owned-businesses";

// Keep public reads compatible with column-level privacy grants in the launch migration.
const PUBLIC_BUSINESS_SELECT = `
  id,
  name,
  description,
  category,
  address,
  lat,
  lng,
  weekly_hours,
  phone,
  whatsapp,
  website,
  instagram,
  kashrut,
  avg_rating,
  review_count,
  is_active,
  created_at,
  expires_at,
  is_verified,
  is_legacy_public,
  photos(id, business_id, url, is_primary, created_at)
`;


export async function getBusinesses(filters?: {
  category?: BusinessCategory;
  kashrut?: KashrutStatus;
  minRating?: number;
  openNow?: boolean;
  date?: string;
}) {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  let query = supabase
    .from("businesses")
    .select(PUBLIC_BUSINESS_SELECT)
    .eq("is_verified", true)
    .eq("is_active", true)
    .or(`is_legacy_public.eq.true,expires_at.gt.${nowIso}`);

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }
  if (filters?.kashrut) {
    query = query.eq("kashrut", filters.kashrut);
  }
  if (filters?.minRating) {
    query = query.gte("avg_rating", filters.minRating);
  }

  const { data, error } = await query;
  if (error) throw error;
  return Promise.all(
    (data ?? []).map(async (business) => ({
      ...business,
      photos: await signPhotoRecords(supabase, business.photos ?? []),
    })),
  );
}

export async function getBusinessById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("businesses")
    .select(`
      id,
      name,
      description,
      category,
      address,
      lat,
      lng,
      weekly_hours,
      phone,
      whatsapp,
      website,
      instagram,
      kashrut,
      avg_rating,
      review_count,
      is_verified,
      photos(id, business_id, url, is_primary, created_at)
    `)
    .eq("id", id)
    .eq("is_verified", true)
    .eq("is_active", true)
    .or(`is_legacy_public.eq.true,expires_at.gt.${new Date().toISOString()}`)
    .single();

  if (error) throw error;
  return {
    ...data,
    photos: await signPhotoRecords(supabase, data.photos ?? []),
  };
}

export async function getBusinessesByOwner(ownerId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== ownerId) throw new Error("Not authorized");
  return getOwnedBusinesses(supabase);
}

/** @deprecated Use getBusinessesByOwner instead */
export async function getBusinessByOwner(ownerId: string) {
  const businesses = await getBusinessesByOwner(ownerId);
  return businesses[0] ?? null;
}

export async function createBusiness(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const businessData = {
    owner_id: user.id,
    name: formData.get("name") as string,
    description: formData.get("description") as string | null,
    category: formData.get("category") as BusinessCategory,
    phone: formData.get("phone") as string | null,
    whatsapp: formData.get("whatsapp") as string | null,
    website: formData.get("website") as string | null,
    instagram: formData.get("instagram") as string | null,
    kashrut: (formData.get("kashrut") as KashrutStatus) ?? "none",
    business_number: formData.get("business_number") as string | null,
    is_active: false, // Requires admin approval before going live
  };

  const { error } = await supabase
    .from("businesses")
    .insert(businessData);

  if (error) throw error;
  const data = await getLatestOwnedBusiness(supabase);
  if (!data) throw new Error("Created business was not returned");

  // Email notification moved to webhook after payment
  revalidatePath("/dashboard");
  return data as Business;
}

export async function updateBusiness(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const updates = {
    name: formData.get("name") as string,
    description: formData.get("description") as string | null,
    category: formData.get("category") as BusinessCategory,
    phone: formData.get("phone") as string | null,
    whatsapp: formData.get("whatsapp") as string | null,
    website: formData.get("website") as string | null,
    instagram: formData.get("instagram") as string | null,
    kashrut: formData.get("kashrut") as KashrutStatus,
    business_number: formData.get("business_number") as string | null,
  };

  const { error } = await supabase
    .from("businesses")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
  const data = (await getOwnedBusinesses(supabase)).find((business) => business.id === id);
  if (!data) throw new Error("Updated business was not returned");
  revalidatePath(`/businesses/${id}`);
  revalidatePath("/dashboard/profile");
  return data as Business;
}
