/**
 * HYP / YaadPay client.
 *
 * Endpoint: https://icom.yaad.net/p/
 * Flow:
 *   1. Build payment params (Masof, PassP, Amount, ...).
 *   2. POST with action=APISign&What=SIGN&KEY=<api key>&<params> →
 *      response body is the same querystring with `signature=<hex>` appended.
 *   3. Redirect user to https://icom.yaad.net/p/?<signed querystring>.
 *      HYP shows the hosted card-entry page, processes the charge, and
 *      redirects back to our successUrl with payment results.
 *   4. Return handler POSTs return params back with What=VERIFY&KEY=<api key>
 *      to confirm authenticity; CCode=0 means charged.
 *
 * Discovery / signing semantics confirmed against:
 *   - https://www.npmjs.com/package/yaadpaysimplifier (official-style sample)
 *   - Production signed URLs in HYP merchant emails
 */

const HYP_ENDPOINT = "https://icom.yaad.net/p/";

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
    "Content-Type": "application/x-www-form-urlencoded",
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

  const res = await fetch(HYP_ENDPOINT, {
    method: "POST",
    headers: hypHeaders(),
    body: signParams.toString(),
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
  const res = await fetch(HYP_ENDPOINT, {
    method: "POST",
    headers: hypHeaders(),
    body: signParams.toString(),
  });
  const body = (await res.text()).trim();
  const bodyIsHtml = /^\s*<(!doctype|html)/i.test(body);
  const parsed = bodyIsHtml ? null : new URLSearchParams(body);
  return {
    ok: res.ok && !!parsed?.get("signature"),
    status: res.status,
    signature: parsed?.get("signature") ?? null,
    ccode: parsed?.get("CCode") ?? null,
    bodyExcerpt: body.slice(0, 600),
    bodyIsHtml,
    envFlags,
  };
}

/**
 * Calls APISign?What=VERIFY with the return-redirect query params HYP sent us.
 * Returns true if HYP confirms authenticity (CCode=0 in verify response).
 */
export async function verifyReturnSignature(returnQuery: URLSearchParams): Promise<boolean> {
  const { apiKey } = getCreds();

  const verifyParams = new URLSearchParams();
  verifyParams.set("action", "APISign");
  verifyParams.set("What", "VERIFY");
  verifyParams.set("KEY", apiKey);
  // Forward every return param except our own routing concerns. HYP needs the
  // exact set it originally signed.
  for (const [k, v] of returnQuery.entries()) {
    if (k === "action" || k === "What" || k === "KEY") continue;
    verifyParams.append(k, v);
  }

  const res = await fetch(HYP_ENDPOINT, {
    method: "POST",
    headers: hypHeaders(),
    body: verifyParams.toString(),
  });

  if (!res.ok) return false;

  const body = (await res.text()).trim();
  const parsed = new URLSearchParams(body);
  return parsed.get("CCode") === "0";
}

/**
 * Issues a refund for a previously successful transaction.
 * `transId` is the HYP `Id` returned in the success redirect.
 *
 * HYP exposes refunds via action=APISign&What=PAY with negative-amount
 * + Sign5 patterns, but the simpler path that works for one-shot Masof
 * accounts is action=cancelTrans. If your Masof isn't enabled for it, this
 * returns false and you cancel manually in the HYP merchant console.
 */
export async function refundTransaction(transId: string): Promise<{
  ok: boolean;
  raw: string;
}> {
  const { masof, passp } = getCreds();

  const params = new URLSearchParams({
    action: "cancelTrans",
    Masof: masof,
    PassP: passp,
    TransId: transId,
  });

  const res = await fetch(HYP_ENDPOINT, {
    method: "POST",
    headers: hypHeaders(),
    body: params.toString(),
  });

  const raw = (await res.text()).trim();
  const parsed = new URLSearchParams(raw);
  return { ok: res.ok && parsed.get("CCode") === "0", raw };
}
