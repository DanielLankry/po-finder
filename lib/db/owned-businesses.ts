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

/** Resolves an explicitly selected owned row; unknown IDs must never edit a different business. */
export async function getLatestOwnedBusiness(
  supabase: SupabaseClient,
  requestedId?: string | null,
): Promise<Business | null> {
  const businesses = await getOwnedBusinesses(supabase);
  if (requestedId) return businesses.find((business) => business.id === requestedId) ?? null;
  return businesses[0] ?? null;
}
