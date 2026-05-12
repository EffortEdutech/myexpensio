#!/usr/bin/env node
/**
 * myexpensio — Automated UAT API Test Script
 * ============================================
 * Runs HTTP tests against the deployed Vercel apps.
 *
 * Usage (PowerShell):
 *   $env:USER_SESSION_TOKEN  = "eyJ..."   # token from employee account
 *   $env:ADMIN_SESSION_TOKEN = "eyJ..."   # token from workspace admin account
 *   $env:CS_SESSION_TOKEN    = "eyJ..."   # token from CS console account
 *   node scripts/uat-api-tests.js
 *
 * How to get a session token:
 *   1. Log in to the relevant Vercel app in Chrome
 *   2. Press F12 -> Application tab -> Storage -> Cookies -> your app URL
 *   3. Find the cookie starting with "sb-" ending with "-auth-token"
 *   4. Copy the "access_token" value from the JSON (starts with eyJ)
 *
 * Requirements: Node.js 18+ (uses built-in fetch)
 */

// ── Config ─────────────────────────────────────────────────────────────────

// App URLs — override with env vars if needed, otherwise uses production Vercel URLs
const USER_APP    = (process.env.USER_APP_URL  || 'https://myexpensio-jade.vercel.app').replace(/\/$/, '')
const ADMIN_APP   = (process.env.ADMIN_APP_URL || 'https://myexpensio-admin.vercel.app').replace(/\/$/, '')
const CS_APP      = (process.env.CS_APP_URL    || 'https://myexpensio-cs.vercel.app').replace(/\/$/, '')

const USER_TOKEN  = process.env.USER_SESSION_TOKEN  || ''
const ADMIN_TOKEN = process.env.ADMIN_SESSION_TOKEN || ''
const CS_TOKEN    = process.env.CS_SESSION_TOKEN    || ''

// ── Helpers ─────────────────────────────────────────────────────────────────

let passed = 0
let failed = 0
let skipped = 0

function log(icon, label, detail = '') {
  const detail_str = detail ? `  →  ${detail}` : ''
  console.log(`  ${icon}  ${label}${detail_str}`)
}

function pass(label, detail = '') {
  passed++
  log('✅', label, detail)
}

function fail(label, detail = '') {
  failed++
  log('❌', label, detail)
}

function skip(label, reason = '') {
  skipped++
  log('⏭ ', label, reason || 'skipped')
}

async function req(baseUrl, path, { method = 'GET', token, body } = {}) {
  const url = `${baseUrl}${path}`
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
    let json = null
    const text = await res.text()
    try { json = JSON.parse(text) } catch (_) { /* not JSON */ }
    return { status: res.status, json, text }
  } catch (e) {
    return { status: 0, json: null, text: String(e) }
  }
}

function section(title) {
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`  ${title}`)
  console.log('─'.repeat(60))
}

// ── Preflight ────────────────────────────────────────────────────────────────

function checkConfig() {
  section('Preflight — Configuration Check')
  let ok = true

  if (!USER_APP)    { fail('USER_APP_URL is set');    ok = false } else { pass('USER_APP_URL is set', USER_APP) }
  if (!ADMIN_APP)   { fail('ADMIN_APP_URL is set');   ok = false } else { pass('ADMIN_APP_URL is set', ADMIN_APP) }
  if (!CS_APP)      { fail('CS_APP_URL is set');      ok = false } else { pass('CS_APP_URL is set', CS_APP) }
  if (!USER_TOKEN)  { fail('USER_SESSION_TOKEN is set');  ok = false } else { pass('USER_SESSION_TOKEN is set', '(present)') }
  if (!ADMIN_TOKEN) { fail('ADMIN_SESSION_TOKEN is set'); ok = false } else { pass('ADMIN_SESSION_TOKEN is set', '(present)') }
  if (!CS_TOKEN)    { fail('CS_SESSION_TOKEN is set');    ok = false } else { pass('CS_SESSION_TOKEN is set', '(present)') }

  if (!ok) {
    console.log('\n  ⚠️  Set missing environment variables before running. Exiting.\n')
    process.exit(1)
  }
}

// ── Test Suites ──────────────────────────────────────────────────────────────

// ---- User App: Auth --------------------------------------------------------
async function testUserAuth() {
  section('User App — Authentication')

  // Unauthenticated request should be rejected
  const r1 = await req(USER_APP, '/api/usage/current')
  if (r1.status === 401) {
    pass('GET /api/usage/current (no token) → 401', `status=${r1.status}`)
  } else {
    fail('GET /api/usage/current (no token) should return 401', `got ${r1.status}`)
  }

  // Authenticated request
  const r2 = await req(USER_APP, '/api/usage/current', { token: USER_TOKEN })
  if (r2.status === 200 && r2.json?.counters !== undefined) {
    pass('GET /api/usage/current (with token) → 200', `tier=${r2.json?.tier ?? '?'}`)
  } else {
    fail('GET /api/usage/current (with token) should return 200', `got ${r2.status} — ${r2.text?.slice(0, 100)}`)
  }
}

// ---- User App: Trips -------------------------------------------------------
async function testTrips() {
  section('User App — Trips')

  // List trips
  const r1 = await req(USER_APP, '/api/trips', { token: USER_TOKEN })
  if (r1.status === 200 && Array.isArray(r1.json?.items)) {
    pass('GET /api/trips → 200 with items array', `count=${r1.json.items.length}`)
  } else {
    fail('GET /api/trips → 200', `got ${r1.status} — ${r1.text?.slice(0, 100)}`)
  }

  // Create a selected-route trip
  const r2 = await req(USER_APP, '/api/trips', {
    method: 'POST',
    token: USER_TOKEN,
    body: {
      calculation_mode: 'SELECTED_ROUTE',
      origin_text: 'Kuala Lumpur City Centre',
      destination_text: 'Petaling Jaya, Selangor',
      vehicle_type: 'car',
      transport_type: 'personal_car',
    },
  })
  if (r2.status === 201 && r2.json?.trip?.id) {
    pass('POST /api/trips (SELECTED_ROUTE) → 201', `trip_id=${r2.json.trip.id}`)
    const tripId = r2.json.trip.id

    // Fetch the newly created trip
    const r3 = await req(USER_APP, `/api/trips/${tripId}`, { token: USER_TOKEN })
    if (r3.status === 200 && r3.json?.trip?.id === tripId) {
      pass(`GET /api/trips/${tripId} → 200`, `status=${r3.json.trip.status}`)
    } else {
      fail(`GET /api/trips/${tripId} → 200`, `got ${r3.status}`)
    }

    return tripId
  } else if (r2.status === 429) {
    skip('POST /api/trips — limit reached this month', `${r2.json?.error?.message ?? ''}`)
    return null
  } else {
    fail('POST /api/trips (SELECTED_ROUTE) → 201', `got ${r2.status} — ${r2.text?.slice(0, 150)}`)
    return null
  }
}

// ---- User App: Claims ------------------------------------------------------
async function testClaims(tripId) {
  section('User App — Claims')

  // List claims
  const r1 = await req(USER_APP, '/api/claims', { token: USER_TOKEN })
  if (r1.status === 200) {
    pass('GET /api/claims → 200', `count=${r1.json?.items?.length ?? r1.json?.data?.length ?? '?'}`)
  } else {
    fail('GET /api/claims → 200', `got ${r1.status}`)
  }

  // Create a draft claim
  const today = new Date().toISOString().slice(0, 10)
  const r2 = await req(USER_APP, '/api/claims', {
    method: 'POST',
    token: USER_TOKEN,
    body: {
      title: `UAT Test Claim ${today}`,
      period_start: today,
      period_end: today,
    },
  })

  if (r2.status !== 201 || !r2.json?.claim?.id) {
    fail('POST /api/claims → 201', `got ${r2.status} — ${r2.text?.slice(0, 150)}`)
    return null
  }
  const claimId = r2.json.claim.id
  pass('POST /api/claims → 201', `claim_id=${claimId}`)

  // Add a mileage item (requires a trip)
  if (tripId) {
    const r3 = await req(USER_APP, `/api/claims/${claimId}/items`, {
      method: 'POST',
      token: USER_TOKEN,
      body: {
        type: 'mileage',
        claim_date: today,
        trip_id: tripId,
        vehicle_type: 'car',
      },
    })
    if (r3.status === 201) {
      pass(`POST /api/claims/${claimId}/items (mileage) → 201`, `item_id=${r3.json?.item?.id}`)
    } else {
      fail(`POST /api/claims/${claimId}/items (mileage) → 201`, `got ${r3.status} — ${r3.text?.slice(0, 150)}`)
    }
  } else {
    skip('POST mileage item — no tripId available')
  }

  // Add a receipt item
  const r4 = await req(USER_APP, `/api/claims/${claimId}/items`, {
    method: 'POST',
    token: USER_TOKEN,
    body: {
      type: 'receipt',
      claim_date: today,
      merchant: 'UAT Test Merchant',
      amount: 50.00,
      currency: 'MYR',
      notes: 'UAT automated test item',
    },
  })
  if (r4.status === 201) {
    pass(`POST /api/claims/${claimId}/items (receipt) → 201`)
  } else {
    fail(`POST /api/claims/${claimId}/items (receipt) → 201`, `got ${r4.status} — ${r4.text?.slice(0, 150)}`)
  }

  // Submit the claim
  const r5 = await req(USER_APP, `/api/claims/${claimId}/submit`, {
    method: 'POST',
    token: USER_TOKEN,
  })
  if (r5.status === 200 && r5.json?.claim?.status === 'SUBMITTED') {
    pass(`POST /api/claims/${claimId}/submit → 200 SUBMITTED`)
  } else {
    fail(`POST /api/claims/${claimId}/submit → 200`, `got ${r5.status} — ${r5.text?.slice(0, 150)}`)
  }

  // Try to re-submit (idempotency)
  const r6 = await req(USER_APP, `/api/claims/${claimId}/submit`, {
    method: 'POST',
    token: USER_TOKEN,
  })
  if (r6.status === 409) {
    pass(`POST /api/claims/${claimId}/submit (re-submit) → 409 CONFLICT (idempotent)`)
  } else {
    fail(`POST /api/claims/${claimId}/submit re-submit → 409`, `got ${r6.status}`)
  }

  return claimId
}

// ---- User App: Billing ------------------------------------------------------
async function testBilling() {
  section('User App — Billing')

  // Billing catalog
  const r1 = await req(USER_APP, '/api/billing/catalog', { token: USER_TOKEN })
  if (r1.status === 200 && r1.json?.plans) {
    pass('GET /api/billing/catalog → 200', `plans=${Object.keys(r1.json.plans ?? {}).join(', ')}`)
  } else {
    fail('GET /api/billing/catalog → 200', `got ${r1.status} — ${r1.text?.slice(0, 100)}`)
  }

  // Billing summary
  const r2 = await req(USER_APP, '/api/billing/summary', { token: USER_TOKEN })
  if (r2.status === 200) {
    pass('GET /api/billing/summary → 200', `tier=${r2.json?.tier ?? '?'}`)
  } else {
    fail('GET /api/billing/summary → 200', `got ${r2.status} — ${r2.text?.slice(0, 100)}`)
  }

  // Checkout with invalid plan (should 400, not 500)
  const r3 = await req(USER_APP, '/api/billing/checkout', {
    method: 'POST',
    token: USER_TOKEN,
    body: {
      plan_code: 'INVALID_PLAN',
      provider: 'STRIPE',
      success_url: `${USER_APP}/billing?success=1`,
      cancel_url: `${USER_APP}/billing`,
    },
  })
  if (r3.status === 400 && r3.json?.error?.code) {
    pass('POST /api/billing/checkout (invalid plan) → 400 with error code', `code=${r3.json.error.code}`)
  } else {
    fail('POST /api/billing/checkout (invalid plan) → 400', `got ${r3.status} — ${r3.text?.slice(0, 100)}`)
  }

  // Checkout with valid plan (should 200 with checkout_url, OR 500 if Stripe not configured)
  const r4 = await req(USER_APP, '/api/billing/checkout', {
    method: 'POST',
    token: USER_TOKEN,
    body: {
      plan_code: 'PRO_MONTHLY',
      provider: 'STRIPE',
      success_url: `${USER_APP}/billing?success=1`,
      cancel_url: `${USER_APP}/billing`,
    },
  })
  if (r4.status === 200 && r4.json?.checkout_url) {
    pass('POST /api/billing/checkout (PRO_MONTHLY) → 200 with checkout_url')
  } else if (r4.status === 400 && r4.json?.error?.code === 'VALIDATION_ERROR') {
    fail('POST /api/billing/checkout (PRO_MONTHLY) → Stripe price IDs not configured in Vercel env vars', `${r4.json?.error?.message}`)
  } else if (r4.status === 409) {
    skip('POST /api/billing/checkout (PRO_MONTHLY) → 409 (workspace already on Pro)')
  } else if (r4.status === 500) {
    fail('POST /api/billing/checkout (PRO_MONTHLY) → 500 server error', `${r4.text?.slice(0, 150)}`)
  } else {
    fail('POST /api/billing/checkout (PRO_MONTHLY) → unexpected response', `got ${r4.status} — ${r4.text?.slice(0, 150)}`)
  }
}

// ---- User App: Exports ------------------------------------------------------
async function testExports(claimId) {
  section('User App — Exports')

  // Export history
  const r1 = await req(USER_APP, '/api/exports/history', { token: USER_TOKEN })
  if (r1.status === 200) {
    pass('GET /api/exports/history → 200', `count=${r1.json?.exports?.length ?? r1.json?.items?.length ?? '?'}`)
  } else {
    fail('GET /api/exports/history → 200', `got ${r1.status}`)
  }

  if (!claimId) {
    skip('POST /api/exports — no claimId available (claim creation failed earlier)')
    return
  }

  // Generate CSV export
  const r2 = await req(USER_APP, '/api/exports', {
    method: 'POST',
    token: USER_TOKEN,
    body: {
      claim_ids: [claimId],
      format: 'CSV',
    },
  })
  if (r2.status === 200 || r2.status === 201) {
    pass('POST /api/exports (CSV) → success', `export_id=${r2.json?.export_id ?? r2.json?.id ?? '?'}`)
  } else if (r2.status === 429) {
    skip('POST /api/exports (CSV) → 429 export limit reached this month')
  } else {
    fail('POST /api/exports (CSV) → success', `got ${r2.status} — ${r2.text?.slice(0, 150)}`)
  }
}

// ---- Admin App: Claims review -----------------------------------------------
async function testAdminClaims() {
  section('Workspace Admin — Claims')

  // Unauthenticated
  const r1 = await req(ADMIN_APP, '/api/workspace/claims')
  if (r1.status === 401 || r1.status === 403) {
    pass('GET /api/workspace/claims (no token) → 401/403', `status=${r1.status}`)
  } else {
    fail('GET /api/workspace/claims (no token) should deny', `got ${r1.status}`)
  }

  // Authenticated
  const r2 = await req(ADMIN_APP, '/api/workspace/claims', { token: ADMIN_TOKEN })
  if (r2.status === 200) {
    pass('GET /api/workspace/claims (admin token) → 200', `count=${r2.json?.claims?.length ?? r2.json?.data?.length ?? '?'}`)
  } else {
    fail('GET /api/workspace/claims (admin token) → 200', `got ${r2.status} — ${r2.text?.slice(0, 100)}`)
  }

  // Filter by status SUBMITTED
  const r3 = await req(ADMIN_APP, '/api/workspace/claims?status=SUBMITTED', { token: ADMIN_TOKEN })
  if (r3.status === 200) {
    const count = r3.json?.claims?.length ?? r3.json?.data?.length ?? '?'
    pass('GET /api/workspace/claims?status=SUBMITTED → 200', `count=${count}`)
    // If there are results, verify all have SUBMITTED status
    const items = r3.json?.claims ?? r3.json?.data ?? []
    if (items.length > 0) {
      const allSubmitted = items.every(c => c.status === 'SUBMITTED')
      if (allSubmitted) {
        pass('All returned claims have status=SUBMITTED')
      } else {
        fail('Not all returned claims have status=SUBMITTED — filter not working')
      }
    }
  } else {
    fail('GET /api/workspace/claims?status=SUBMITTED → 200', `got ${r3.status}`)
  }
}

// ---- Admin App: Members -----------------------------------------------------
async function testAdminMembers() {
  section('Workspace Admin — Members')

  const r1 = await req(ADMIN_APP, '/api/workspace/members', { token: ADMIN_TOKEN })
  if (r1.status === 200) {
    pass('GET /api/workspace/members → 200', `count=${r1.json?.members?.length ?? r1.json?.data?.length ?? '?'}`)
  } else {
    fail('GET /api/workspace/members → 200', `got ${r1.status} — ${r1.text?.slice(0, 100)}`)
  }
}

// ---- Admin App: Billing -----------------------------------------------------
async function testAdminBilling() {
  section('Workspace Admin — Billing')

  const r1 = await req(ADMIN_APP, '/api/workspace/billing', { token: ADMIN_TOKEN })
  if (r1.status === 200 && r1.json?.subscription !== undefined) {
    pass('GET /api/workspace/billing → 200', `tier=${r1.json.subscription?.tier ?? '?'}`)
  } else {
    fail('GET /api/workspace/billing → 200', `got ${r1.status} — ${r1.text?.slice(0, 100)}`)
  }
}

// ---- Admin App: Rates -------------------------------------------------------
async function testAdminRates() {
  section('Workspace Admin — Rates')

  const r1 = await req(ADMIN_APP, '/api/workspace/rates', { token: ADMIN_TOKEN })
  if (r1.status === 200) {
    pass('GET /api/workspace/rates → 200')
  } else {
    fail('GET /api/workspace/rates → 200', `got ${r1.status}`)
  }

  const r2 = await req(ADMIN_APP, '/api/workspace/team-rates', { token: ADMIN_TOKEN })
  if (r2.status === 200) {
    pass('GET /api/workspace/team-rates → 200')
  } else {
    fail('GET /api/workspace/team-rates → 200', `got ${r2.status}`)
  }
}

// ---- CS Console: Workspaces -------------------------------------------------
async function testCSWorkspaces() {
  section('CS Console — Workspaces')

  // Unauthenticated
  const r1 = await req(CS_APP, '/api/console/workspaces')
  if (r1.status === 401 || r1.status === 403) {
    pass('GET /api/console/workspaces (no token) → 401/403')
  } else {
    fail('GET /api/console/workspaces (no token) should deny', `got ${r1.status}`)
  }

  // Authenticated CS staff
  const r2 = await req(CS_APP, '/api/console/workspaces', { token: CS_TOKEN })
  if (r2.status === 200) {
    pass('GET /api/console/workspaces (CS token) → 200', `count=${r2.json?.workspaces?.length ?? r2.json?.data?.length ?? '?'}`)
  } else {
    fail('GET /api/console/workspaces (CS token) → 200', `got ${r2.status} — ${r2.text?.slice(0, 100)}`)
  }

  // Search
  const r3 = await req(CS_APP, '/api/console/workspaces-search?q=test', { token: CS_TOKEN })
  if (r3.status === 200) {
    pass('GET /api/console/workspaces-search?q=test → 200')
  } else {
    fail('GET /api/console/workspaces-search → 200', `got ${r3.status}`)
  }
}

// ---- CS Console: Invitation Queue -------------------------------------------
async function testCSInvitationQueue() {
  section('CS Console — Invitation Queue')

  const r1 = await req(CS_APP, '/api/console/invitation-queue', { token: CS_TOKEN })
  if (r1.status === 200) {
    pass('GET /api/console/invitation-queue → 200', `count=${r1.json?.requests?.length ?? r1.json?.data?.length ?? '?'}`)
  } else {
    fail('GET /api/console/invitation-queue → 200', `got ${r1.status} — ${r1.text?.slice(0, 100)}`)
  }

  // Filter by PENDING
  const r2 = await req(CS_APP, '/api/console/invitation-queue?status=PENDING', { token: CS_TOKEN })
  if (r2.status === 200) {
    pass('GET /api/console/invitation-queue?status=PENDING → 200')
  } else {
    fail('GET /api/console/invitation-queue?status=PENDING → 200', `got ${r2.status}`)
  }
}

// ---- CS Console: Users ------------------------------------------------------
async function testCSUsers() {
  section('CS Console — Users')

  const r1 = await req(CS_APP, '/api/console/users', { token: CS_TOKEN })
  if (r1.status === 200) {
    pass('GET /api/console/users → 200', `count=${r1.json?.users?.length ?? r1.json?.data?.length ?? '?'}`)
  } else {
    fail('GET /api/console/users → 200', `got ${r1.status} — ${r1.text?.slice(0, 100)}`)
  }
}

// ---- CS Console: Subscriptions ----------------------------------------------
async function testCSSubscriptions() {
  section('CS Console — Subscriptions')

  const r1 = await req(CS_APP, '/api/console/subscriptions', { token: CS_TOKEN })
  if (r1.status === 200) {
    pass('GET /api/console/subscriptions → 200')
  } else {
    fail('GET /api/console/subscriptions → 200', `got ${r1.status}`)
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n' + '═'.repeat(60))
  console.log('  myexpensio — Automated UAT API Tests')
  console.log('  ' + new Date().toISOString())
  console.log('═'.repeat(60))

  checkConfig()

  // User App
  await testUserAuth()
  const tripId  = await testTrips()
  const claimId = await testClaims(tripId)
  await testBilling()
  await testExports(claimId)

  // Workspace Admin App
  await testAdminClaims()
  await testAdminMembers()
  await testAdminBilling()
  await testAdminRates()

  // CS Console
  await testCSWorkspaces()
  await testCSInvitationQueue()
  await testCSUsers()
  await testCSSubscriptions()

  // Summary
  const total = passed + failed + skipped
  console.log('\n' + '═'.repeat(60))
  console.log('  RESULTS')
  console.log('─'.repeat(60))
  console.log(`  ✅  Passed:  ${passed}`)
  console.log(`  ❌  Failed:  ${failed}`)
  console.log(`  ⏭   Skipped: ${skipped}`)
  console.log(`  📊  Total:   ${total}`)
  console.log('═'.repeat(60) + '\n')

  if (failed > 0) {
    process.exit(1) // Non-zero exit so CI pipelines detect failures
  }
}

main().catch(err => {
  console.error('\nFatal error:', err)
  process.exit(1)
})
