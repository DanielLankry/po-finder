import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/admin-session";
import { sendSupportReply } from "@/lib/email";
import { adminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const replySchema = z.object({
  message: z.string().trim().min(1).max(5000),
});

/** Send one admin-authored response through the public support identity. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = replySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "יש לכתוב תשובה באורך של עד 5,000 תווים" }, { status: 400 });
  }

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "מזהה פנייה לא תקין" }, { status: 400 });
  }
  const admin = adminClient();
  const { data: contact, error: contactError } = await admin
    .from("contact_messages")
    .select("id, name, email, subject_label")
    .eq("id", id)
    .maybeSingle();

  if (contactError) return NextResponse.json({ error: contactError.message }, { status: 500 });
  if (!contact) return NextResponse.json({ error: "הפנייה לא נמצאה" }, { status: 404 });

  const { data: reply, error: replyError } = await admin
    .from("contact_replies")
    .insert({ contact_message_id: id, body: parsed.data.message })
    .select("id")
    .single();

  if (replyError || !reply) {
    return NextResponse.json({ error: "לא ניתן היה להכין את התשובה לשליחה" }, { status: 500 });
  }

  try {
    const resendEmailId = await sendSupportReply(
      contact.email,
      contact.name,
      contact.subject_label,
      parsed.data.message
    );
    const sentAt = new Date().toISOString();
    const [replyUpdate, messageUpdate] = await Promise.all([
      admin
        .from("contact_replies")
        .update({ delivery_status: "sent", resend_email_id: resendEmailId, sent_at: sentAt })
        .eq("id", reply.id),
      admin
        .from("contact_messages")
        .update({ status: "replied", last_replied_at: sentAt })
        .eq("id", id),
    ]);

    if (replyUpdate.error || messageUpdate.error) {
      console.error("Support reply was sent but its audit state could not be updated");
    }

    return NextResponse.json({ ok: true, sentAt });
  } catch (error) {
    const safeError = error instanceof Error ? error.message.slice(0, 500) : "Unknown Resend error";
    await admin
      .from("contact_replies")
      .update({ delivery_status: "failed", error_message: safeError })
      .eq("id", reply.id);
    console.error("Support reply delivery failed");
    return NextResponse.json({ error: "שליחת המייל נכשלה. אפשר לנסות שוב." }, { status: 502 });
  }
}
