import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/types";

const USER_ROLES = new Set<UserRole>(["customer", "business_owner"]);

type AuthUserLike = Pick<User, "id" | "email" | "user_metadata">;

export interface PublicUserInsert {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

function getMetadataString(
  metadata: AuthUserLike["user_metadata"],
  key: string,
): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function publicUserInsertFromAuthUser(
  user: AuthUserLike,
  fallbackRole: UserRole,
): PublicUserInsert {
  const metadataRole = getMetadataString(user.user_metadata, "role");
  const role = metadataRole && USER_ROLES.has(metadataRole as UserRole)
    ? metadataRole as UserRole
    : fallbackRole;

  return {
    id: user.id,
    email: user.email ?? "",
    role,
    name:
      getMetadataString(user.user_metadata, "name") ??
      getMetadataString(user.user_metadata, "full_name") ??
      "",
  };
}

export async function ensurePublicUser(
  supabase: SupabaseClient,
  user: AuthUserLike,
  fallbackRole: UserRole,
): Promise<void> {
  const { data: existing, error: selectError } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return;

  const { error: insertError } = await supabase
    .from("users")
    .insert(publicUserInsertFromAuthUser(user, fallbackRole));

  if (insertError && insertError.code !== "23505") {
    throw insertError;
  }
}
