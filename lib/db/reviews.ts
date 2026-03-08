"use server";

import { createClient } from "@/lib/supabase/server";
import type { Review } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function getReviews(businessId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*, user:users(name, avatar_url)")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Review[];
}

export async function getUserReview(businessId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("business_id", businessId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data as Review | null;
}

export async function createReview(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const businessId = formData.get("business_id") as string;
  const rating = parseInt(formData.get("rating") as string, 10);
  const comment = formData.get("comment") as string | null;

  const { data, error } = await supabase
    .from("reviews")
    .insert({ business_id: businessId, user_id: user.id, rating, comment })
    .select()
    .single();

  if (error) throw error;
  revalidatePath(`/businesses/${businessId}`);
  return data as Review;
}

export async function updateReview(reviewId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const businessId = formData.get("business_id") as string;
  const rating = parseInt(formData.get("rating") as string, 10);
  const comment = formData.get("comment") as string | null;

  const { data, error } = await supabase
    .from("reviews")
    .update({ rating, comment })
    .eq("id", reviewId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw error;
  revalidatePath(`/businesses/${businessId}`);
  return data as Review;
}

export async function deleteReview(reviewId: string, businessId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath(`/businesses/${businessId}`);
}
