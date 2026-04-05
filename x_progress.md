# MyExpensio — Progress (Local Dev)

## Running services
- User app: http://localhost:3100
- Admin app: http://localhost:3101
- Supabase Studio: http://127.0.0.1:54323
- Mailpit: http://127.0.0.1:54324

## Phase 1 checklist
### Frontend skeleton
- [x] User routes: /login, /accept-invite, /forgot-password, /home, /trips, /claims, /settings
- [x] Admin routes: /login, /orgs, /orgs/new, /orgs/[id], /orgs/[id]/invites

### Next tasks
- [ ] Implement invite-only auth flow (disable public signup in main UI)
- [ ] Create org bootstrap (owner) and org selection in UI
- [ ] Trips: create + list + finalize
- [ ] Claims: create + items + submit (lock)
- [ ] Admin: organizations list + invitation create