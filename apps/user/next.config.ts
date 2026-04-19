// apps/user/next.config.ts

import type { NextConfig } from 'next'
import pkg from './package.json'

const nextConfig: NextConfig = {
  // pdfkit reads font .afm files from disk using __dirname-relative paths.
  // pdf-parse v2.x has no ESM default export — must stay as CJS via require().
  // pdfjs-dist uses dynamic worker threads and must NOT be bundled by webpack.
  // All three must be excluded from Turbopack/webpack server bundling.
  serverExternalPackages: ['pdfkit', 'pdf-parse', 'pdfjs-dist'],

  // Inject app version at build time from package.json.
  // standard-version bumps package.json → Vercel builds → version is baked in.
  // No .env.production needed. Falls back to .env.local override if set.
  env: {
    NEXT_PUBLIC_APP_VERSION:
      process.env.NEXT_PUBLIC_APP_VERSION ?? pkg.version,
  },
}

export default nextConfig
