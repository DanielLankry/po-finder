function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        "For local development, configure .env.local (npm run vercel:env for a linked Vercel project). " +
        "For hosted builds, configure the variable in the matching Vercel Development, Preview, or Production environment."
    );
  }
  return value;
}

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: requireEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"),
} as const;
