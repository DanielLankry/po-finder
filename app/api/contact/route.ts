import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { sendContactAutoReply, ADMIN_EMAIL, FROM_EMAIL } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { adminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

const SUBJECT_LABELS: Record<string, string> = {
  general: "שאלה כללית",
  business: "הוספת עסק",
  bug: "דיווח על תקלה",
  privacy: "פרטיות ומידע",
  billing: "חיוב ותשלומים",
  other: "אחר",
};

/** Escape customer-controlled values before placing them in notification HTML. */
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(254),
  subject: z.enum(["general", "business", "bug", "privacy", "billing", "other"]),
  message: z.string().trim().min(1, "Message is required").max(2000),
  privacyAccepted: z.literal(true),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 5 requests per minute per IP
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (!rateLimit(`contact:${ip}`, 5, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = parsed.data;
    const subjectLabel = SUBJECT_LABELS[subject] ?? subject;
    const safeName = escapeHtml(name);
    const safeSubjectLabel = escapeHtml(subjectLabel);
    const notificationName = name.replace(/[\r\n]+/g, " ");
    const admin = adminClient();
    const { data: savedMessage, error: saveError } = await admin
      .from("contact_messages")
      .insert({ name, email, subject, subject_label: subjectLabel, message })
      .select("id")
      .single();

    if (saveError || !savedMessage) {
      console.error("Contact form persistence failed");
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }

    // Notify support, while the persisted admin inbox remains the source of truth.
    const { error: supportError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `[פנייה חדשה] ${subjectLabel} — ${notificationName}`,
      html: `
        <div dir="rtl" style="font-family: Assistant,Arial,sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background:#F7F3EA; color:#17402D;">
          <div style="background:#FFFDF7; border:2px solid #17402D; border-radius:16px; padding:24px; box-shadow:6px 6px 0 #17402D;">
            <p style="color:#8A3618; font-weight:800; margin:0 0 8px;">פנייה חדשה נקלטה</p>
            <h2 style="margin:0 0 12px;">${safeSubjectLabel}</h2>
            <p style="color:#57534E; line-height:1.6;">הפנייה של ${safeName} נשמרה בתיבת התמיכה המאובטחת.</p>
            <a href="https://pokarov.co.il/admin/contact" style="display:inline-block; margin-top:12px; padding:12px 22px; background:#C4552D; color:white; border:2px solid #8A3618; border-radius:10px; font-weight:800; text-decoration:none;">לצפייה ולמענה דרך support ←</a>
          </div>
        </div>
      `,
    });
    if (supportError) {
      console.error("Contact support notification failed");
    }

    try {
      await sendContactAutoReply(email, name, subjectLabel);
    } catch {
      console.error("Contact auto-reply failed");
    }

    return NextResponse.json({ ok: true, messageId: savedMessage.id });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
