import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-session";
import { adminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/** Return the private contact queue and its outbound reply history. */
export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = adminClient();
  const { data: messages, error: messagesError } = await admin
    .from("contact_messages")
    .select("id, name, email, subject, subject_label, message, status, created_at, last_replied_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (messagesError) {
    return NextResponse.json({ error: messagesError.message }, { status: 500 });
  }

  const messageIds = (messages ?? []).map((message) => message.id);
  let replies: Array<Record<string, unknown>> = [];

  if (messageIds.length > 0) {
    const { data, error } = await admin
      .from("contact_replies")
      .select("id, contact_message_id, body, delivery_status, created_at, sent_at")
      .in("contact_message_id", messageIds)
      .order("created_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    replies = data ?? [];
  }

  return NextResponse.json({
    messages: (messages ?? []).map((message) => ({
      ...message,
      replies: replies.filter((reply) => reply.contact_message_id === message.id),
    })),
  });
}
