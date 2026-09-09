import "server-only";

import { createHash } from "node:crypto";

const DEFAULT_META_GRAPH_API_VERSION = "v26.0";
const DEFAULT_META_PIXEL_ID = "27527545196939763";

interface MetaLeadEventInput {
  eventId: string;
  eventSourceUrl: string;
  email: string;
  externalId: string;
  phone?: string | null;
  clientIp?: string | null;
  clientUserAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  category?: string | null;
}

export interface MetaConversionResult {
  sent: boolean;
  reason?: "not_configured";
}

/** Normalizes and hashes customer data before it leaves the application server. */
function hashMetaValue(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

/** Builds one consented website Lead event with browser/server deduplication metadata. */
export function buildMetaLeadEvent(input: MetaLeadEventInput) {
  const phone = input.phone?.replace(/\D/g, "") ?? "";
  const userData: Record<string, string | string[]> = {
    em: [hashMetaValue(input.email)],
    external_id: [hashMetaValue(input.externalId)],
  };

  if (phone) userData.ph = [hashMetaValue(phone)];
  if (input.clientIp) userData.client_ip_address = input.clientIp;
  if (input.clientUserAgent) userData.client_user_agent = input.clientUserAgent;
  if (input.fbp) userData.fbp = input.fbp;
  if (input.fbc) userData.fbc = input.fbc;

  return {
    event_name: "Lead",
    event_time: Math.floor(Date.now() / 1000),
    event_id: input.eventId,
    event_source_url: input.eventSourceUrl,
    action_source: "website",
    user_data: userData,
    custom_data: {
      content_name: "business_draft",
      content_category: input.category ?? "local_business",
    },
  };
}

/** Sends a server-side Meta Lead when the secret CAPI token is configured. */
export async function sendMetaLeadEvent(
  input: MetaLeadEventInput,
): Promise<MetaConversionResult> {
  const accessToken = process.env.META_CONVERSIONS_API_ACCESS_TOKEN;
  if (!accessToken) return { sent: false, reason: "not_configured" };

  const pixelId =
    process.env.META_PIXEL_ID ??
    process.env.NEXT_PUBLIC_META_PIXEL_ID ??
    DEFAULT_META_PIXEL_ID;
  const apiVersion =
    process.env.META_GRAPH_API_VERSION ?? DEFAULT_META_GRAPH_API_VERSION;
  const payload: Record<string, unknown> = {
    data: [buildMetaLeadEvent(input)],
  };

  if (process.env.META_TEST_EVENT_CODE) {
    payload.test_event_code = process.env.META_TEST_EVENT_CODE;
  }

  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${pixelId}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(
      `Meta Conversions API rejected Lead (${response.status}): ${responseText.slice(0, 300)}`,
    );
  }

  return { sent: true };
}
