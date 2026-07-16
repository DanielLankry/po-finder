"use server";

import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import type { Review } from "@/lib/types";
import { revalidatePath } from "next/cache";

const PUBLIC_REVIEW_SELECT =
  "id, business_id, rating, comment, reviewer_name, created_at";

export async function getReviews(businessId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(PUBLIC_REVIEW_SELECT)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Review[];
}

export async function getUserReview(businessId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // user_id is intentionally not selectable through the browser Data API.
  // This server-only lookup binds the privileged query to the verified user.
  const { data, error } = await adminClient()
    .from("reviews")
    .select("id, business_id, user_id, rating, comment, reviewer_name, created_at")
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
    .select(PUBLIC_REVIEW_SELECT)
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
    .select(PUBLIC_REVIEW_SELECT)
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
    .eq("id", reviewId);

  if (error) throw error;
  revalidatePath(`/businesses/${businessId}`);
}
