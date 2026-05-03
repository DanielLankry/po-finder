import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET(req: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;
  return NextResponse.redirect(`${origin}/pricing?payment=cancelled`);
}
