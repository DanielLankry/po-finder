import { NextResponse } from "next/server";
import { getFirstBusinessesPromotionStatus } from "@/lib/launch-promotion-server";

export const dynamic = "force-dynamic";

/** Returns campaign eligibility and its fixed cap without exposing live claims. */
export async function GET() {
  const promotion = await getFirstBusinessesPromotionStatus();

  return NextResponse.json(
    { promotion },
    { headers: { "Cache-Control": "no-store" } },
  );
}
