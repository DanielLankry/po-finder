const ALLOWED_ORIGINS = [
  "https://pokarov.co.il",
  "https://www.pokarov.co.il",
  "https://po-finder.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
];

export function getSafeOrigin(req: Request): string {
  const origin = req.headers.get("origin") ?? "";
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  return "https://pokarov.co.il";
}
