import { createClient } from "@/lib/supabase/server";
import type { Spot } from "@/lib/types";

export async function getActiveSpots(): Promise<Spot[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("spots")
    .select("*")
    .eq("status", "approved")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  return (data ?? []) as Spot[];
}

export async function getSpotsByOwner(ownerId: string): Promise<Spot[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("spots")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Spot[];
}
