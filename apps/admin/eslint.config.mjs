import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals.js'
import nextTs from 'eslint-config-next/typescript.js'

const asArray = (value) => (Array.isArray(value) ? value : [value])

export default defineConfig([
  ...asArray(nextVitals),
  ...asArray(nextTs),
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])