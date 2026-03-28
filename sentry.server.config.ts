import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://7335ac22f3e46398dad42757e01e7358@o4511094041083904.ingest.de.sentry.io/4511094049210448",
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  enabled: true,
  ignoreErrors: ["NEXT_NOT_FOUND", "NEXT_REDIRECT"],
});
