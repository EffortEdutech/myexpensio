// apps/user/next.config.ts

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // pdfkit reads font .afm files from disk using __dirname-relative paths.
  // pdf-parse v2.x has no ESM default export — must stay as CJS via require().
  // Both must be excluded from Turbopack/webpack bundling.
  serverExternalPackages: ['pdfkit', 'pdf-parse'],
}

export default nextConfig
