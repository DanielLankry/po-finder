import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { contactAutoReplyTemplate } from "@/lib/email-templates";

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

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const subjectLabel = SUBJECT_LABELS[subject] ?? subject;

    // Send to support
    await resend.emails.send({
      from: "פוקרוב <noreply@pokarov.co.il>",
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
      from: "פוקרוב <noreply@pokarov.co.il>",
      to: email,
      subject: "קיבלנו את פנייתך — פוקרוב",
      html: contactAutoReplyTemplate(name, subjectLabel),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
