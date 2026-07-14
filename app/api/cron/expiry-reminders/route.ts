import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { sendExpiryReminder } from "@/lib/email";
import {
  EXPIRY_REMINDER_DAYS,
  getExpiryReminderWindow,
} from "@/lib/expiry-reminders";

export const runtime = "nodejs";

interface ExpiringBusiness {
  id: string;
  name: string;
  owner_id: string;
  expires_at: string;
}

/** Sends idempotent 30/7/1-day reminders from a Vercel-authenticated daily cron.
 * A unique database claim is created before email delivery so retries cannot
 * send duplicates, while failed deliveries release the claim for the next run.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "cron_not_configured" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = adminClient();
  const now = new Date();
  const result = { checked: 0, sent: 0, skipped: 0, failed: 0 };

  for (const daysBefore of EXPIRY_REMINDER_DAYS) {
    const { start, end } = getExpiryReminderWindow(now, daysBefore);
    const { data, error } = await db
      .from("businesses")
      .select("id, name, owner_id, expires_at")
      .eq("is_active", true)
      .eq("is_verified", true)
      .eq("is_legacy_public", false)
      .gte("expires_at", start.toISOString())
      .lt("expires_at", end.toISOString());

    if (error) {
      return NextResponse.json(
        { error: "business_query_failed", detail: error.message },
        { status: 500 }
      );
    }

    for (const business of (data ?? []) as ExpiringBusiness[]) {
      result.checked += 1;
      const { error: claimError } = await db
        .from("expiry_reminder_deliveries")
        .insert({
          business_id: business.id,
          days_before: daysBefore,
          expires_at: business.expires_at,
        });

      if (claimError?.code === "23505") {
        result.skipped += 1;
        continue;
      }
      if (claimError) {
        result.failed += 1;
        continue;
      }

      let delivered = false;
      try {
        const { data: owner, error: ownerError } =
          await db.auth.admin.getUserById(business.owner_id);
        if (ownerError || !owner.user.email) {
          throw new Error(ownerError?.message ?? "owner email is missing");
        }

        await sendExpiryReminder(
          owner.user.email,
          business.name,
          new Date(business.expires_at),
          daysBefore
        );
        delivered = true;

        const { error: sentError } = await db
          .from("expiry_reminder_deliveries")
          .update({ sent_at: new Date().toISOString() })
          .eq("business_id", business.id)
          .eq("days_before", daysBefore)
          .eq("expires_at", business.expires_at);
        if (sentError) throw sentError;
        result.sent += 1;
      } catch (caught) {
        result.failed += 1;
        // Retry only when delivery itself failed. Once Resend accepted the
        // message, keep the unique claim even if marking sent_at had a transient
        // database failure, otherwise a later cron could send a duplicate.
        if (!delivered) {
          await db
            .from("expiry_reminder_deliveries")
            .delete()
            .eq("business_id", business.id)
            .eq("days_before", daysBefore)
            .eq("expires_at", business.expires_at);
        }
        console.error("Failed to send expiry reminder", {
          businessId: business.id,
          daysBefore,
          error: caught instanceof Error ? caught.message : String(caught),
        });
      }
    }
  }

  return NextResponse.json({ ok: true, ...result });
}
