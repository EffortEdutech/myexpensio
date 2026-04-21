// apps/user/next.config.ts

import type { NextConfig } from 'next'
import pkg from './package.json'

const nextConfig: NextConfig = {
  // pdfkit reads font .afm files from disk using __dirname-relative paths.
  // pdf-parse v2.x has no ESM default export — must stay as CJS via require().
  // pdfjs-dist uses dynamic worker threads and must NOT be bundled by webpack.
  // All three must be excluded from Turbopack/webpack server bundling.
  serverExternalPackages: ['pdfkit', 'pdf-parse', 'pdfjs-dist'],

  transpilePackages: ['@myexpensio/domain'],

  // Always read version from package.json at Vercel build time.
  // standard-version bumps package.json → Vercel builds → correct version baked in.
  // Do NOT set NEXT_PUBLIC_APP_VERSION in the Vercel dashboard — it will override this.
  // Local dev: override via apps/user/.env.local if needed.
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },
}

export default nextConfig
