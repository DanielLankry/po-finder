/**
 * HYP Pay Protocol client.
 *
 * Endpoint: https://pay.hyp.co.il/p/  (official, per https://hypay.docs.apiary.io/)
 *
 * Flow (4 steps from the spec):
 *   1. GET /p/?action=APISign&What=SIGN&KEY=<api>&PassP=<pass>&Masof=<masof>&<pay params>
 *      → response body is the same querystring (with `action=pay`) plus
 *      `signature=<hex>` appended.
 *   2. Redirect the buyer to https://pay.hyp.co.il/p/?<signed querystring>.
 *      HYP shows the hosted card-entry page and charges the card.
 *   3. HYP redirects back to our success/error URL with Id, CCode, ACode,
 *      Order, Sign, etc.
 *   4. We verify by GETting /p/?action=APISign&What=VERIFY&KEY=<api>&PassP=<pass>&
 *      Masof=<masof>&<all return params>. CCode=0 means HYP confirms authenticity.
 */

const HYP_ENDPOINT = "https://pay.hyp.co.il/p/";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  // Trim — pasted-from-PDF newlines silently break HYP auth.
  return v.trim();
}

function getCreds() {
  return {
    masof: requireEnv("HYP_MASOF"),
    passp: requireEnv("HYP_PASSP"),
    apiKey: requireEnv("HYP_API_KEY"),
  };
}

/**
 * Headers HYP perimeter check expects on server-to-server APISign calls.
 * Some merchant terminals reject requests with empty Referer / Origin
 * (HTML response titled "Hyp" with "HTTP REFERER:" / "REMOTE HOST:" empty).
 */
function hypHeaders(): Record<string, string> {
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://pokarov.co.il";
  return {
    Referer: `${origin}/`,
    Origin: origin,
    "User-Agent": "pokarov.co.il/1.0 (+server-checkout)",
  };
}

/**
 * If HYP rejects before authentication (IP/Referer perimeter), it returns an
 * HTML page (charset windows-1255) titled "Hyp" with empty REFERER / REMOTE
 * HOST fields. Detect that and throw a clear, actionable error instead of
 * dumping ~10KB of HTML into Sentry.
 */
function describeNoSignatureBody(body: string): string {
  const looksLikeHtml = /^\s*<(!doctype|html)/i.test(body);
  if (looksLikeHtml) {
    if (/HTTP\s*REFERER/i.test(body) || /REMOTE\s*HOST/i.test(body)) {
      return "HYP perimeter rejected request (empty Referer/Remote-Host). Merchant terminal needs Referer/IP allowlist disabled or pokarov.co.il whitelisted.";
    }
    return "HYP returned HTML instead of signed querystring (likely auth/perimeter block).";
  }
  // HYP returned a flat querystring with CCode but no signature — auth/CCode failure.
  const parsed = new URLSearchParams(body);
  const ccode = parsed.get("CCode");
  if (ccode) {
    return `HYP rejected sign request (CCode=${ccode}). 902=KEY/PassP mismatch; 901=Masof not API-permitted.`;
  }
  return `HYP APISign returned no signature. Body: ${body.slice(0, 300)}`;
}

export interface CheckoutParams {
  /** Amount in shekels (integer, e.g. 270 for ₪270). HYP expects whole shekels. */
  amount: number;
  /** Free-text payment description shown on the HYP page and receipt. */
  info: string;
  /** Our internal order ID — round-tripped on return as `Order`. */
  order: string;
  /** Buyer email — required for HYP-issued receipt. */
  email: string;
  /** Buyer first name. */
  firstName: string;
  /** Buyer last name. */
  lastName: string;
  /** Buyer phone (optional). */
  phone?: string;
  /** URLs HYP redirects to. */
  successUrl: string;
  errorUrl: string;
  cancelUrl: string;
}

/**
 * Builds the params HYP expects for a one-shot ILS charge with Hebrew receipt
 * and no installments.
 */
function buildPayParams(p: CheckoutParams, masof: string, passp: string): Record<string, string> {
  return {
    action: "pay",
    Masof: masof,
    PassP: passp,
    Amount: String(p.amount),
    Info: p.info,
    Order: p.order,
    Coin: "1",
    UTF8: "True",
    UTF8out: "True",
    PageLang: "HEB",
    tmp: "1",
    Tash: "1",
    FixTash: "True",
    sendemail: "True",
    SendHesh: "True",
    MoreData: "True",
    Sign: "True",
    J5: "False",
    Postpone: "False",
    ShowEngTashText: "False",
    UserId: "000000000",
    ClientName: p.firstName,
    ClientLName: p.lastName,
    email: p.email,
    phone: p.phone ?? "",
    cell: p.phone ?? "",
    SuccessUrl: p.successUrl,
    ErrorUrl: p.errorUrl,
    CancelUrl: p.cancelUrl,
  };
}

/**
 * Calls APISign?What=SIGN and returns the user-facing redirect URL with the
 * `signature` parameter appended. Throws on HTTP error or empty signature.
 */
export async function createSignedCheckoutUrl(p: CheckoutParams): Promise<string> {
  const { masof, passp, apiKey } = getCreds();
  const payParams = buildPayParams(p, masof, passp);

  const signParams = new URLSearchParams({
    action: "APISign",
    What: "SIGN",
    KEY: apiKey,
    ...payParams,
  });

  // Per the HYP Pay Protocol spec the SIGN call is a GET to /p/?...
  const res = await fetch(`${HYP_ENDPOINT}?${signParams.toString()}`, {
    method: "GET",
    headers: hypHeaders(),
  });

  if (!res.ok) {
    throw new Error(`HYP APISign HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }

  const body = (await res.text()).trim();
  const parsed = new URLSearchParams(body);
  if (!parsed.get("signature")) {
    throw new Error(describeNoSignatureBody(body));
  }

  return `${HYP_ENDPOINT}?${body}`;
}

/**
 * Diagnostic helper for the admin debug route. Runs APISign and returns
 * raw HYP response without throwing, so the operator can see the actual
 * body when debugging credential / perimeter issues.
 */
export async function debugSignCheckoutRaw(): Promise<{
  ok: boolean;
  status: number;
  signature: string | null;
  ccode: string | null;
  bodyExcerpt: string;
  bodyIsHtml: boolean;
  envFlags: { masof: boolean; passp: boolean; apiKey: boolean; siteUrl: boolean };
  /** What we actually sent — useful for confirming Referer/Origin are reaching HYP. */
  sentRequest: { url: string; headers: Record<string, string> };
  /** HYP response headers (look for ICOM/Set-Cookie hints). */
  responseHeaders: Record<string, string>;
  /** Echo of what httpbin.org saw — confirms whether Node's fetch in this runtime
   *  preserves Referer/Origin or strips them. */
  outboundHeadersAsSeenByEcho: Record<string, string> | null;
}> {
  const envFlags = {
    masof: !!process.env.HYP_MASOF?.trim(),
    passp: !!process.env.HYP_PASSP?.trim(),
    apiKey: !!process.env.HYP_API_KEY?.trim(),
    siteUrl: !!process.env.NEXT_PUBLIC_SITE_URL?.trim(),
  };
  if (!envFlags.masof || !envFlags.passp || !envFlags.apiKey) {
    return {
      ok: false,
      status: 0,
      signature: null,
      ccode: null,
      bodyExcerpt: "missing one of HYP_MASOF / HYP_PASSP / HYP_API_KEY",
      bodyIsHtml: false,
      envFlags,
      sentRequest: { url: "", headers: {} },
      responseHeaders: {},
      outboundHeadersAsSeenByEcho: null,
    };
  }
  const { masof, passp, apiKey } = getCreds();
  const params = buildPayParams(
    {
      amount: 10,
      info: "debug",
      order: "debug-" + Date.now(),
      email: "debug@pokarov.co.il",
      firstName: "Debug",
      lastName: "Probe",
      phone: "",
      successUrl: "https://pokarov.co.il/api/payments/return",
      errorUrl: "https://pokarov.co.il/api/payments/return",
      cancelUrl: "https://pokarov.co.il/api/payments/cancel",
    },
    masof,
    passp,
  );
  const signParams = new URLSearchParams({
    action: "APISign",
    What: "SIGN",
    KEY: apiKey,
    ...params,
  });
  const headers = hypHeaders();
  const fullUrl = `${HYP_ENDPOINT}?${signParams.toString()}`;
  // Redact secrets from the URL we report back.
  const redactedUrl = fullUrl
    .replace(/KEY=[^&]+/, "KEY=<redacted>")
    .replace(/PassP=[^&]+/, "PassP=<redacted>");

  const res = await fetch(fullUrl, { method: "GET", headers });
  const body = (await res.text()).trim();
  const bodyIsHtml = /^\s*<(!doctype|html)/i.test(body);
  const parsed = bodyIsHtml ? null : new URLSearchParams(body);

  const responseHeaders: Record<string, string> = {};
  res.headers.forEach((v, k) => { responseHeaders[k] = v; });

  // Independently confirm what headers Node's fetch is actually emitting on
  // outbound requests in this runtime — httpbin echoes back the headers it
  // received. If "Referer" is missing here, the runtime is stripping it.
  let outboundHeadersAsSeenByEcho: Record<string, string> | null = null;
  try {
    const echoRes = await fetch("https://httpbin.org/anything", { method: "GET", headers });
    if (echoRes.ok) {
      const echoJson = (await echoRes.json()) as { headers?: Record<string, string> };
      outboundHeadersAsSeenByEcho = echoJson.headers ?? null;
    }
  } catch {
    outboundHeadersAsSeenByEcho = null;
  }

  return {
    ok: res.ok && !!parsed?.get("signature"),
    status: res.status,
    signature: parsed?.get("signature") ?? null,
    ccode: parsed?.get("CCode") ?? null,
    bodyExcerpt: body.slice(0, 4000),
    bodyIsHtml,
    envFlags,
    sentRequest: { url: redactedUrl, headers },
    responseHeaders,
    outboundHeadersAsSeenByEcho,
  };
}

/**
 * Calls APISign?What=VERIFY with the return-redirect query params HYP sent us.
 * Returns true if HYP confirms authenticity (CCode=0 in verify response).
 */
export async function verifyReturnSignature(returnQuery: URLSearchParams): Promise<boolean> {
  const { masof, passp, apiKey } = getCreds();

  // Per the spec, the verify URL is:
  //   /p/?action=APISign&What=VERIFY&KEY=<api>&PassP=<pass>&Masof=<masof>&<all return params>
  // PassP/Masof aren't in the return redirect, so add them explicitly.
  const verifyParams = new URLSearchParams();
  verifyParams.set("action", "APISign");
  verifyParams.set("What", "VERIFY");
  verifyParams.set("KEY", apiKey);
  verifyParams.set("PassP", passp);
  verifyParams.set("Masof", masof);
  for (const [k, v] of returnQuery.entries()) {
    if (k === "action" || k === "What" || k === "KEY" || k === "PassP" || k === "Masof") continue;
    verifyParams.append(k, v);
  }

  const res = await fetch(`${HYP_ENDPOINT}?${verifyParams.toString()}`, {
    method: "GET",
    headers: hypHeaders(),
  });

  if (!res.ok) return false;

  const body = (await res.text()).trim();
  const parsed = new URLSearchParams(body);
  return parsed.get("CCode") === "0";
}

/**
 * Cancels a transaction same-day (action=CancelTrans, per HYP Pay Protocol).
 * `transId` is the HYP `Id` returned in the success redirect. Only works
 * before the deal is settled (~23:30 same day). Returns CCode=920 if the
 * transaction doesn't exist or is already settled — fall back to action=zikoyAPI
 * (refund by trans #) or to a manual refund in the merchant console.
 */
export async function refundTransaction(transId: string): Promise<{
  ok: boolean;
  raw: string;
}> {
  const { masof, passp } = getCreds();

  const params = new URLSearchParams({
    action: "CancelTrans",
    Masof: masof,
    PassP: passp,
    TransId: transId,
  });

  const res = await fetch(`${HYP_ENDPOINT}?${params.toString()}`, {
    method: "GET",
    headers: hypHeaders(),
  });

  const raw = (await res.text()).trim();
  const parsed = new URLSearchParams(raw);
  return { ok: res.ok && parsed.get("CCode") === "0", raw };
}
