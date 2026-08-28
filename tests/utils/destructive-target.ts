const PRODUCTION_APP_HOST = 'pokarov.co.il';

/** Matches the production hostname after canonicalizing DNS absolute-name dots. */
export function isProductionAppHost(hostname: string): boolean {
  const canonicalHostname = hostname.replace(/\.+$/, '').toLowerCase();
  return (
    canonicalHostname === PRODUCTION_APP_HOST ||
    canonicalHostname.endsWith(`.${PRODUCTION_APP_HOST}`)
  );
}
