import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { contactAutoReplyTemplate } from "@/lib/email-templates";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

const VALID_SUBJECTS = [
  "general",
  "business",
  "bug",
  "privacy",
  "billing",
  "other",
] as const;

const SUBJECT_LABELS: Record<string, string> = {
  general: "שאלה כללית",
  business: "הוספת עסק",
  bug: "דיווח על תקלה",
  privacy: "פרטיות ומידע",
  billing: "חיוב ותשלומים",
  other: "אחר",
};

const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  subject: z.enum(["general", "business", "bug", "privacy", "billing", "other"]),
  message: z.string().min(1, "Message is required").max(2000),
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

    // Send to support
    await resend.emails.send({
      from: "פה קרוב <noreply@pokarov.co.il>",
      to: "support@pokarov.co.il",
      replyTo: email,
      subject: `[פנייה חדשה] ${subjectLabel} — ${name}`,
      html: `
        <div dir="rtl" style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #059669; margin-bottom: 16px;">פנייה חדשה מהאתר</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background: #f9f9f9;">
              <td style="padding: 10px 12px; font-weight: bold; width: 100px;">שם:</td>
              <td style="padding: 10px 12px;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; font-weight: bold;">מייל:</td>
              <td style="padding: 10px 12px;"><a href="mailto:${email}">${email}</a></td>
            </tr>
            <tr style="background: #f9f9f9;">
              <td style="padding: 10px 12px; font-weight: bold;">נושא:</td>
              <td style="padding: 10px 12px;">${subjectLabel}</td>
            </tr>
          </table>
          <div style="margin-top: 16px; padding: 16px; background: #f9f9f9; border-right: 4px solid #059669; border-radius: 4px;">
            <p style="margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
          <p style="color: #aaa; font-size: 12px; margin-top: 16px;">נשלח מ-pokarov.co.il</p>
        </div>
      `,
    });

    // Auto-reply to sender with beautiful template
    await resend.emails.send({
      from: "פה קרוב <noreply@pokarov.co.il>",
      to: email,
      subject: "קיבלנו את פנייתך — פה קרוב",
      html: contactAutoReplyTemplate(name, subjectLabel),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
