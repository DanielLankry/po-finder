const encoder = new TextEncoder();

export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;

type CookieRequest = {
  cookies: {
    get(name: string): { value: string } | undefined;
  };
};

function getAdminSecret() {
  return process.env.ADMIN_SECRET ?? "";
}

function base64UrlEncode(value: ArrayBuffer | Uint8Array) {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function sign(value: string) {
  const secret = getAdminSecret();
  if (!secret) throw new Error("Missing ADMIN_SECRET");

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return base64UrlEncode(signature);
}

export async function createAdminSessionValue() {
  const expiresAt = Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE;
  const nonce = crypto.randomUUID();
  const payload = `v1.${expiresAt}.${nonce}`;
  return `${payload}.${await sign(payload)}`;
}

export async function verifyAdminSessionValue(value: string | undefined | null) {
  if (!value || !getAdminSecret()) return false;

  const parts = value.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") return false;

  const expiresAt = Number(parts[1]);
  if (!Number.isFinite(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) {
    return false;
  }

  const payload = parts.slice(0, 3).join(".");
  const expected = await sign(payload);
  return constantTimeEqual(expected, parts[3]);
}

export async function isAdminRequest(req: CookieRequest) {
  return verifyAdminSessionValue(req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}
