import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
const SENTRY_HOST = "o4511094041083904.ingest.de.sentry.io";
const SENTRY_PROJECT_IDS = ["4511094049210448"];
export async function POST(req: NextRequest) {
  try {
    const envelope = await req.text();
    const pieces = envelope.split("\n");
    const header = JSON.parse(pieces[0]);
    const dsn = new URL(header["dsn"]);
    if (dsn.hostname !== SENTRY_HOST) return NextResponse.json({ error: "Invalid DSN" }, { status: 400 });
    const projectId = dsn.pathname.replace("/", "");
    if (!SENTRY_PROJECT_IDS.includes(projectId)) return NextResponse.json({ error: "Invalid project" }, { status: 400 });
    const url = `https://${SENTRY_HOST}/api/${projectId}/envelope/`;
    const res = await fetch(url, { method: "POST", body: envelope, headers: { "Content-Type": "application/x-sentry-envelope" } });
    return new NextResponse(await res.text(), { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
