#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const requiredPaths = [
  'pnpm-workspace.yaml',
  'packages/domain/package.json',
  'apps/user/proxy.ts',
  'apps/admin/proxy.ts',
]

const forbiddenPaths = [
  'apps/admin/app/(protected)/billing',
  'apps/admin/app/(protected)/referrals',
  'apps/admin/app/api/admin/billing',
  'apps/admin/app/api/admin/referrals',
  'apps/admin/app/api/admin/webhooks/billing',
  'apps/admin/app/api/admin/partners',
  'apps/admin/components/billing',
  'apps/admin/components/referrals',
  'apps/admin/lib/billing',
  'apps/admin/lib/referrals',
  'apps/admin/.env.billing.example',
  'apps/admin/pnpm-workspace.yaml',
  'apps/user/pnpm-workspace.yaml',
  'apps/admin/middleware.ts',
  'apps/user/middleware.ts',
]

const sourceScanRoots = [
  'apps/admin/app',
  'apps/admin/components',
  'apps/admin/lib',
]

const forbiddenContentPatterns = [
  '@/lib/billing',
  '/api/admin/billing',
  '/api/admin/referrals',
  '/api/admin/webhooks/billing',
  "from '@/components/billing",
  "from '@/components/referrals",
  "from '@/lib/referrals",
]

const ignoreDirNames = new Set([
  '.git',
  '.next',
  'node_modules',
  'dist',
  'build',
  'coverage',
])

const ignoreExtensions = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.pdf', '.zip', '.woff', '.woff2'
])

function rel(p) {
  return p.split(path.sep).join('/')
}

function walk(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir)) {
    const abs = path.join(dir, entry)
    const st = statSync(abs)
    if (st.isDirectory()) {
      if (ignoreDirNames.has(entry)) continue
      walk(abs, out)
    } else {
      if (ignoreExtensions.has(path.extname(entry).toLowerCase())) continue
      out.push(abs)
    }
  }
  return out
}

const failures = []
const warnings = []

for (const p of requiredPaths) {
  const abs = path.join(root, p)
  if (!existsSync(abs)) {
    failures.push(`Missing required path: ${p}`)
  }
}

for (const p of forbiddenPaths) {
  const abs = path.join(root, p)
  if (existsSync(abs)) {
    failures.push(`Forbidden legacy path still exists: ${p}`)
  }
}

for (const scanRoot of sourceScanRoots) {
  const absRoot = path.join(root, scanRoot)
  if (!existsSync(absRoot)) continue
  for (const file of walk(absRoot)) {
    const fileRel = rel(path.relative(root, file))
    let content = ''
    try {
      content = readFileSync(file, 'utf8')
    } catch {
      warnings.push(`Skipped non-text or unreadable file: ${fileRel}`)
      continue
    }
    for (const pattern of forbiddenContentPatterns) {
      if (content.includes(pattern)) {
        failures.push(`Forbidden legacy import/reference found in ${fileRel}: ${pattern}`)
      }
    }
  }
}

const header = '\n== MyExpensio refactor lock audit ==\n'
process.stdout.write(header)

if (warnings.length > 0) {
  process.stdout.write('\nWarnings:\n')
  for (const w of warnings) process.stdout.write(`- ${w}\n`)
}

if (failures.length > 0) {
  process.stdout.write('\nFAIL\n')
  for (const f of failures) process.stdout.write(`- ${f}\n`)
  process.exit(1)
}

process.stdout.write('\nPASS\n')
process.stdout.write('- Required workspace/proxy paths are present\n')
process.stdout.write('- Legacy admin monetization paths are absent\n')
process.stdout.write('- Legacy admin monetization imports/references were not found\n')
