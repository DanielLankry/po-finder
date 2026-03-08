"use server";

import { createClient } from "@/lib/supabase/server";
import type { BusinessSchedule } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function getTodaySchedule(businessId: string) {
  const supabase = await createClient();
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Jerusalem",
  });

  const { data, error } = await supabase
    .from("business_schedules")
    .select("*")
    .eq("business_id", businessId)
    .eq("date", today)
    .maybeSingle();

  if (error) throw error;
  return data as BusinessSchedule | null;
}

export async function getScheduleForDate(businessId: string, date: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("business_schedules")
    .select("*")
    .eq("business_id", businessId)
    .eq("date", date)
    .maybeSingle();

  if (error) throw error;
  return data as BusinessSchedule | null;
}

export async function getAllSchedules(businessId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("business_schedules")
    .select("*")
    .eq("business_id", businessId)
    .order("date", { ascending: false });

  if (error) throw error;
  return data as BusinessSchedule[];
}

export async function upsertSchedule(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const businessId = formData.get("business_id") as string;
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Jerusalem",
  });

  const scheduleData = {
    business_id: businessId,
    date: today,
    address: formData.get("address") as string | null,
    lat: formData.get("lat") ? parseFloat(formData.get("lat") as string) : null,
    lng: formData.get("lng") ? parseFloat(formData.get("lng") as string) : null,
    open_time: formData.get("open_time") as string | null,
    close_time: formData.get("close_time") as string | null,
    note: formData.get("note") as string | null,
  };

  const { data, error } = await supabase
    .from("business_schedules")
    .upsert(scheduleData, { onConflict: "business_id,date" })
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/dashboard/schedule");
  revalidatePath(`/businesses/${businessId}`);
  return data as BusinessSchedule;
}

export async function deleteSchedule(scheduleId: string, businessId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("business_schedules")
    .delete()
    .eq("id", scheduleId);

  if (error) throw error;
  revalidatePath("/dashboard/schedule");
  revalidatePath(`/businesses/${businessId}`);
}

// isOpenNow is in lib/utils/schedule.ts (pure function, not a server action)
