// apps/user/next.config.ts
//
// CRITICAL for PDF export:
//   pdfkit reads font .afm files from disk using __dirname-relative paths.
//   If Next.js bundles pdfkit via webpack, __dirname resolves to the
//   webpack bundle output — not node_modules — and the font files are not
//   found, causing:
//     ENOENT: no such file or directory, open '...pdfkit/js/data/Helvetica.afm'
//
//   serverExternalPackages tells Next.js to leave pdfkit untouched in
//   node_modules so its internal require() calls resolve correctly.

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdfkit'],

  // ── Other existing config goes below ──────────────────────────────────────
  // (merge with your existing next.config.ts if you already have one)
}

export default nextConfig
