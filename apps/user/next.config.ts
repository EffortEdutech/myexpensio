// apps/user/next.config.ts

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // pdfkit reads font .afm files from disk using __dirname-relative paths.
  // pdf-parse v2.x has no ESM default export — must stay as CJS via require().
  // pdfjs-dist uses dynamic worker threads and must NOT be bundled by webpack.
  // All three must be excluded from Turbopack/webpack server bundling.
  serverExternalPackages: ['pdfkit', 'pdf-parse', 'pdfjs-dist'],
}

export default nextConfig
