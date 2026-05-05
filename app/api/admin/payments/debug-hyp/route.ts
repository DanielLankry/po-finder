import { NextRequest, NextResponse } from "next/server";
import { debugSignCheckoutRaw } from "@/lib/hyp";

export const runtime = "nodejs";

/**
 * Diagnostic: hits HYP APISign with current env and returns the raw response.
 * Use this to spot credential / IP-block / Referer-block issues without
 * having to do a fake purchase.
 *
 *   GET /api/admin/payments/debug-hyp
 *   Cookie: admin_session=<ADMIN_SECRET>
 */
export async function GET(req: NextRequest) {
  const session = req.cookies.get("admin_session")?.value;
  if (session !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await debugSignCheckoutRaw();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, error: "debug probe threw", detail: message },
      { status: 200 }
    );
  }
}
