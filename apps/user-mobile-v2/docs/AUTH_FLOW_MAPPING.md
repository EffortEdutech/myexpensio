# Auth Flow Mapping

Sprint 1 maps the mobile v2 auth surface without building every final screen.

## Login

Mobile v2 uses the NestJS API boundary instead of direct screen-to-Supabase calls.

Flow:

```text
User enters email/password
-> POST /auth/login
-> API validates with Supabase Auth
-> mobile stores session in SecureStore
-> bootstrap sync runs
-> app shell opens
```

Local storage:

```text
expo-secure-store
```

Never store:

```text
service_role key
secret API keys
raw privileged Supabase credentials
```

## Session Restore

Flow:

```text
App opens
-> load SecureStore session
-> set auth store state
-> run lightweight session validation when online
-> open cached shell if offline and session exists
```

## Sign Out

Flow:

```text
User signs out
-> POST /auth/logout when online
-> clear SecureStore session
-> clear or isolate local user data according to final data policy
-> return to signed-out state
```

Sprint 1 policy:

```text
Sign-out cleanup policy is defined at the boundary, but full local database purge is deferred until auth screens are implemented.
```

## Accept Invite

Current app has:

```text
/accept-invite
/api/invite/validate
/api/invite/accept
```

Mobile v2 flow:

```text
Open invite link
-> validate token
-> show invited email/org context
-> login or set password as required
-> accept invite through API
-> complete first login if required
-> bootstrap sync
```

## Complete First Login

Current app has:

```text
/api/auth/complete-first-login
```

Mobile v2 flow:

```text
Authenticated user needs setup
-> collect display/profile fields
-> POST /auth/complete-first-login
-> update profile cache
-> bootstrap spaces/subscription
```

## Biometric Login

Current web/PWA has biometric-login components. Mobile v2 should use a native adapter.

Sprint 1 abstraction:

```text
Biometric capability check
-> user enables biometric unlock
-> mobile stores only local unlock preference/device binding metadata
-> SecureStore/session policy remains authoritative
```

Do not treat biometrics as server authorization. Biometrics unlock a locally stored session; server authorization still depends on valid tokens and API permissions.

