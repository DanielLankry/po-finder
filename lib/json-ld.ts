/**
 * Serialize structured data for an inline application/ld+json script.
 * Escaping HTML-significant characters prevents user-controlled values such
 * as `</script>` from terminating the script element and becoming markup.
 */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
