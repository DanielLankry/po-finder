const SAFE_ORIGIN = "https://pokarov.invalid";

/**
 * Accept only same-site path redirects. This blocks protocol-relative URLs,
 * absolute URLs and backslash-based URL parser ambiguities.
 */
export function safeRedirectPath(
  value: string | null | undefined,
  fallback = "/",
): string {
  const candidate = value?.trim();
  if (
    !candidate ||
    candidate.length > 2048 ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\")
  ) {
    return fallback;
  }

  try {
    const parsed = new URL(candidate, SAFE_ORIGIN);
    if (parsed.origin !== SAFE_ORIGIN) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
