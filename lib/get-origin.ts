const ALLOWED_ORIGINS = [
  "https://po-finder.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
];

export function getSafeOrigin(req: Request): string {
  const origin = req.headers.get("origin") ?? "";
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  // Fallback to production
  return "https://po-finder.vercel.app";
}
