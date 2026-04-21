// apps/admin/lib/billing/http.ts
//
// Minimal response helpers re-created after billing table cleanup.
// This file was deleted during the R1 billing simplification but
// is still imported by some admin routes (commission-plans, orgs).
//
// DO NOT add billing domain logic here.
// This file only contains generic JSON response helpers.

import { NextResponse } from 'next/server'

export function err(code: string, message: string, status: number) {
  return NextResponse.json(
    { ok: false, data: null, error: { code, message } },
    { status }
  )
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json(
    { ok: true, data, error: null },
    { status }
  )
}
