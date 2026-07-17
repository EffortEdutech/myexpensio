// apps/user/jest.config.js
//
// Fixes the pre-existing gap found 2026-07-17: lib/__tests__/tng-matcher.test.ts
// was written against Jest globals (describe/it/expect) but no test runner was
// ever installed in this app, so `tsc --noEmit` failed with TS2582/TS2304 on
// every line of that file, and the tests themselves could never actually run.
//
// Uses Next.js's built-in `next/jest` preset (no extra transform config needed —
// it wires up SWC for TS/TSX, .env loading, and tsconfig path aliases for us).
//
// Run all tests:        pnpm test
// Run one test file:    pnpm test tng-matcher

const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: 'node',   // these are pure business-logic tests, no DOM needed
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

module.exports = createJestConfig(customJestConfig)
