import "server-only";
import { Resend } from "resend";
import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";
import { paymentEmailTemplate } from "@/lib/payment-email-template";

interface EmailRequest { from: string; to: string; replyTo: string; subject: string; html: string; text: string }
interface Job {
  id: string; lease_token: string; recipient: string | null; payload: unknown;
  email_request: EmailRequest | null; attempts: number; previous_uncertain: boolean;
}

/** A timed-out send is uncertain, so the durable retry keeps the same key. */
async function sendWithinDeadline(resend: Resend, request: EmailRequest, id: string) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      resend.emails.send(request, { idempotencyKey: `payment-mail/${id}` }),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("send_timeout")), 8_000); }),
    ]);
  } finally { clearTimeout(timer); }
}

/** The provider accepting a message is distinct from inbox delivery.
 * Requests are persisted before sending so retries use identical content/key.
 * This function always contains delivery errors; payments have already committed.
 */
export async function dispatchPaymentEmails(attemptId?: string) {
  const result = { accepted: 0, failed: 0 };
  if (!process.env.RESEND_API_KEY) return { ...result, failed: 1 };
  try {
    const db = adminClient();
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await db.rpc("claim_payment_emails", { p_limit: 5, p_attempt_id: attemptId ?? null });
    if (error) throw new Error("queue_claim_failed");
    for (const [index, job] of ((data ?? []) as Job[]).entries()) {
      if (index) await new Promise((resolve) => setTimeout(resolve, 600));
      let definiteRejection = false;
      let terminal = false;
      let failureCode = "delivery_uncertain";
      try {
        let request = job.email_request;
        if (!request) {
          const recipient = z.email().safeParse(job.recipient);
          if (!recipient.success) { terminal = true; failureCode = "recipient_missing"; throw new Error(failureCode); }
          request = { from: "פה קרוב <noreply@pokarov.co.il>", to: recipient.data, replyTo: "support@pokarov.co.il", ...paymentEmailTemplate(job.payload) };
          const { data: saved, error: saveError } = await db.from("payment_email_outbox")
            .update({ email_request: request }).eq("id", job.id).eq("lease_token", job.lease_token).eq("status", "sending").select("id").single();
          if (saveError || !saved) throw new Error("request_save_failed");
        }
        // Resend's SDK catches transport failures as application_error. Treat all
        // server/transport responses as uncertain, and never store raw errors/PII.
        const sent = await sendWithinDeadline(resend, request, job.id);
        if (sent.error) {
          const code = sent.error.statusCode;
          definiteRejection = Boolean(code && code >= 400 && code < 500 && code !== 409);
          terminal = definiteRejection && code !== 429;
          failureCode = definiteRejection ? "provider_rejected" : "delivery_uncertain";
          throw new Error(failureCode);
        }
        if (!sent.data?.id) throw new Error("provider_id_missing");
        const { data: acknowledged, error: ackError } = await db.from("payment_email_outbox").update({
          status: "accepted", accepted_at: new Date().toISOString(), provider_message_id: sent.data.id,
          lease_token: null, lease_until: null, uncertain_since: null, last_error: null,
        }).eq("id", job.id).eq("lease_token", job.lease_token).eq("status", "sending").select("id").single();
        if (ackError || !acknowledged) throw new Error("acceptance_save_failed");
        result.accepted++;
      } catch {
        result.failed++;
        const { error: retryError } = await db.from("payment_email_outbox").update({
          status: terminal || job.attempts >= 6 ? "needs_attention" : "pending",
          next_attempt_at: new Date(Date.now() + Math.min(60, 5 * 2 ** (job.attempts - 1)) * 60_000).toISOString(),
          lease_token: null, lease_until: null, last_error: failureCode,
          ...(definiteRejection && !job.previous_uncertain ? { uncertain_since: null } : {}),
        }).eq("id", job.id).eq("lease_token", job.lease_token).eq("status", "sending");
        if (retryError) console.error("Payment email retry state could not be saved", { id: job.id });
      }
    }
  } catch { result.failed++; console.error("Payment email dispatcher unavailable"); }
  return result;
}
