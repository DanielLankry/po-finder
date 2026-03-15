"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { BusinessEvent } from "@/lib/types";

export async function getBusinessEvents(businessId: string): Promise<BusinessEvent[]> {
  const supabase = await createClient();
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });

  const { data, error } = await supabase
    .from("business_events")
    .select("*")
    .eq("business_id", businessId)
    .gte("event_date", todayStr)
    .order("event_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getAllBusinessEvents(businessId: string): Promise<BusinessEvent[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("business_events")
    .select("*")
    .eq("business_id", businessId)
    .order("event_date", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createBusinessEvent(
  businessId: string,
  eventData: {
    title: string;
    description?: string | null;
    event_date: string;
    start_time?: string | null;
    end_time?: string | null;
    price?: number | null;
    image_url?: string | null;
  }
): Promise<BusinessEvent> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("business_events")
    .insert({
      business_id: businessId,
      title: eventData.title,
      description: eventData.description || null,
      event_date: eventData.event_date,
      start_time: eventData.start_time || null,
      end_time: eventData.end_time || null,
      price: eventData.price ?? null,
      image_url: eventData.image_url || null,
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath(`/businesses/${businessId}`);
  revalidatePath("/dashboard/events");
  return data;
}

export async function deleteBusinessEvent(eventId: string, businessId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("business_events")
    .delete()
    .eq("id", eventId)
    .eq("business_id", businessId);

  if (error) throw error;
  revalidatePath(`/businesses/${businessId}`);
  revalidatePath("/dashboard/events");
}
