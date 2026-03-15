"use server";

import { createClient } from "@/lib/supabase/server";
import type { Business, BusinessCategory, KashrutStatus } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function getBusinesses(filters?: {
  category?: BusinessCategory;
  kashrut?: KashrutStatus;
  minRating?: number;
  openNow?: boolean;
  date?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("businesses")
    .select("*, photos(url, is_primary)")
    .eq("is_active", true);

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
  return data;
}

export async function getBusinessById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("*, photos(*)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function getBusinessesByOwner(ownerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
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
  };

  const { data, error } = await supabase
    .from("businesses")
    .insert(businessData)
    .select()
    .single();

  if (error) throw error;
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

  const { data, error } = await supabase
    .from("businesses")
    .update(updates)
    .eq("id", id)
    .eq("owner_id", user.id)
    .select()
    .single();

  if (error) throw error;
  revalidatePath(`/businesses/${id}`);
  revalidatePath("/dashboard/profile");
  return data as Business;
}
