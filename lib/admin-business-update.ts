import type { SupabaseClient } from "@supabase/supabase-js";
import type { Business } from "./types";
import { sendBusinessApprovedEmail } from "./email";

type BusinessUpdates = Partial<Pick<Business,
  "name" | "description" | "category" | "kashrut" | "phone" | "website" |
  "instagram" | "business_number" | "address" | "lat" | "lng" |
  "is_active" | "is_verified" | "expires_at"
>>;

/** Both approval controls use the saved, post-trigger state for the owner's email. */
export async function updateAdminBusiness(
  admin: SupabaseClient,
  id: string,
  updates: BusinessUpdates,
  approveOnly = false,
) {
  const { data: previous, error: readError } = await admin
    .from("businesses").select().eq("id", id).maybeSingle();
  if (readError) return { error: "לא ניתן לקרוא את פרטי העסק", status: 500 } as const;
  if (!previous) return { error: "העסק לא נמצא", status: 404 } as const;
  if (approveOnly && previous.is_verified) {
    return { business: previous as Business, notificationStatus: "not_needed" } as const;
  }

  const approving = !previous.is_verified && updates.is_verified === true;
  const patch = approveOnly ? {
    is_verified: true,
    is_active: previous.is_legacy_public ||
      (!!previous.expires_at && Date.parse(previous.expires_at) > Date.now()),
  } : updates;
  const { data: business, error } = await admin
    .from("businesses").update(patch).eq("id", id)
    // Two simultaneous approval requests must not both send the receipt.
    .eq("is_verified", previous.is_verified).select().maybeSingle();
  if (error) return { error: "שמירת העסק נכשלה", status: 500 } as const;
  if (!business) {
    return { error: "מצב האימות השתנה בזמן העריכה. רעננו את הרשימה ונסו שוב.", status: 409 } as const;
  }
  if (!approving) return { business: business as Business, notificationStatus: "not_needed" } as const;

  try {
    const { data: owner, error: ownerError } = await admin
      .from("users").select("email").eq("id", business.owner_id).single();
    if (ownerError || !owner?.email) throw new Error("Approval recipient unavailable");
    const hasFutureExpiry = !!business.expires_at && Date.parse(business.expires_at) > Date.now();
    await sendBusinessApprovedEmail(
      owner.email,
      business.name,
      hasFutureExpiry ? new Date(business.expires_at) : undefined,
      business.is_active && (business.is_legacy_public || hasFutureExpiry),
    );
    return { business: business as Business, notificationStatus: "sent" } as const;
  } catch (emailError) {
    // Delivery failure must not undo approval or restart a promotional period.
    console.error("Failed to send approval email:", emailError);
    return { business: business as Business, notificationStatus: "failed" } as const;
  }
}
