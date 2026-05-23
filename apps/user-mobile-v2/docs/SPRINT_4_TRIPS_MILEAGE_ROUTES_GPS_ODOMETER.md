# Sprint 4: Trips, Mileage, Routes, GPS, And Odometer

Date: 2026-05-23

## Goal

Port the Work Trips experience into the new local-first mobile v2 app so trips can feed mileage claim items.

## Implemented

- Work footer `Trips` tab is active and navigable.
- Local-first trip repository and React Query hooks.
- Local trip records are queued for sync with `trip` entity type.
- Trips list matching the v1 mental model:
  - active GPS trip banner
  - trip count
  - trip cards with mode/source/status/distance
  - Start GPS Trip
  - Odometer Trip
  - Mileage Calculator
- Trip creation flows:
  - GPS draft trip
  - odometer final trip
  - selected-route/manual mileage final trip
  - local route calculator with map-style preview and route alternatives
  - vehicle type: car / motorcycle
  - date picker and time input
  - origin/destination
  - odometer start/end evidence capture UI
  - notes
- Trip detail flow:
  - status, distance, source, rate
  - stop GPS draft with final distance
  - mileage claim value from personal rates
  - add mileage item to a draft claim
- Settings rates now feed mileage calculation:
  - car mileage rate
  - motorcycle mileage rate

## Production Follow-Ups

- Replace GPS draft stop distance entry with real native GPS point tracking.
- Replace the local route option generator with a real route/map API and route-cache-backed selection.
- Connect odometer evidence choices to native camera, gallery, scan pipeline, upload queue, and metadata.
- Add stale GPS trip recovery/auto-close policy.
- Sync trip schema with backend/NestJS API in Sprint 12.

## Verification

- `corepack pnpm -C apps/user-mobile-v2 typecheck`
- `corepack pnpm -C apps/user-mobile-v2 exec expo export --platform web --clear`
