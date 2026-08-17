This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Install dependencies, then populate `.env.local` with one of the supported
flows:

```bash
npm ci
# Preferred for a checkout already linked to the correct Vercel project:
npm run vercel:env

# Manual alternative (replace every placeholder before starting the app):
cp .env.local.example .env.local
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Keep real credentials in `.env.local`; never commit them. The root layout
validates the required public variables at startup, so a missing value prevents
all routes—including `/pricing`—from rendering.

### Environment scopes

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` must exist in
each Vercel scope that runs the application: Development, Preview, and
Production. Verify the variable names without displaying values:

```bash
vercel env ls development
vercel env ls preview
vercel env ls production
```

After changing a hosted variable, create a new deployment so Next.js can embed
the `NEXT_PUBLIC_` value in the browser bundle. Hosted environment changes and
deployments require recorded approval.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
