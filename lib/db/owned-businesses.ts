import type { SupabaseClient } from "@supabase/supabase-js";
import type { Business } from "@/lib/types";

/** Reads only the signed-in owner's private business rows through the safe RPC. */
export async function getOwnedBusinesses(
  supabase: SupabaseClient,
): Promise<Business[]> {
  const { data, error } = await supabase.rpc("get_my_businesses");
  if (error) throw error;
  return (data ?? []) as Business[];
}

/** Returns the owner's newest business row, matching the one-profile UI. */
export async function getLatestOwnedBusiness(
  supabase: SupabaseClient,
): Promise<Business | null> {
  const businesses = await getOwnedBusinesses(supabase);
  return businesses[0] ?? null;
}
