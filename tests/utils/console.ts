import type { Page, ConsoleMessage } from '@playwright/test';

const IGNORED = [
  /Failed to load resource.*sentry/i,
  /\[GoogleMaps\].*deprecat/i,
  /posthog/i,
  /vercel\.live/i,
  /Download the React DevTools/i,
  /Cookie .* has been rejected/i,
  /cloudflareinsights\.com/i,
  /cloudflare/i,
];

export function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (IGNORED.some((rx) => rx.test(text))) return;
    errors.push(text);
  });
  page.on('pageerror', (err) => {
    if (IGNORED.some((rx) => rx.test(err.message))) return;
    errors.push(`pageerror: ${err.message}`);
  });
  return errors;
}
