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
  - Leaflet/OpenStreetMap route calculator on web:
    - tap map to set origin and destination
    - address suggestions appear while typing
    - selecting a suggestion places it on the map
    - draggable origin/destination pins
    - OSRM route alternatives drawn on the map
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
- Add route-cache-backed selection and backend proxy for route APIs.
- Wire native mobile map tapping with the selected native map package.
- Connect odometer evidence choices to native camera, gallery, scan pipeline, upload queue, and metadata.
- Add stale GPS trip recovery/auto-close policy.
- Sync trip schema with backend/NestJS API in Sprint 12.

## Verification

- `corepack pnpm -C apps/user-mobile-v2 typecheck`
- `corepack pnpm -C apps/user-mobile-v2 exec expo export --platform web --clear`
