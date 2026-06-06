# Dark / Light Mode Decision

**Decision date:** 2026-05-30
**Decision:** Light mode only for launch. System dark mode respected passively.

## Rationale

The app's colour token system (`src/theme/tokens.ts`) uses hard-coded hex values.
All surfaces and text colours have been chosen to work in light mode.

Building a full dark-mode palette before the Sprint 15 QA pass would risk
introducing untested layout regressions. The audience for Pilot (Sprint 17) is
primarily enterprise users on corporate devices, where system theming is less
common than on consumer devices.

## What this means in practice

- `useColorScheme()` is NOT used — the app ignores the system preference.
- No `DynamicColorIOS` or `PlatformColor` wrappers are used.
- Background, surface, text, and border values are fixed light-mode values.

## Revisit point

Dark mode should be added in the Sprint 17–18 window, after pilot user feedback
confirms it is a meaningful request. At that point, the `tokens.ts` file is the
single source to update — all components consume colours exclusively from tokens,
so a full palette swap can be done in one file.
