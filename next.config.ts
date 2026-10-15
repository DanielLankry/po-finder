import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const deploymentGitSha = process.env.PO_DEPLOY_GIT_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA;
const deploymentHeaders = deploymentGitSha && /^[0-9a-f]{40}$/.test(deploymentGitSha)
  ? [{ key: "X-Deployment-Git-Sha", value: deploymentGitSha }]
  : [];

const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
];

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ymqlqdhelsocibhnanjy.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [...securityHeaders, ...deploymentHeaders],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "daniel-lonkry-software",
  project: "pokarov",
  silent: !process.env.CI,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
    automaticVercelMonitors: true,
  },
});
