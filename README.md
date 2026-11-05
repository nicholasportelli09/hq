# hq

A countdown, a task list and a vote. One page a hackathon team shares live. No accounts: make a room, send the link.

- **Clock**: big countdown to the submission deadline; turns orange in the final hour.
- **Tasks**: one list. Claim with your initials, tick when done.
- **Ideas**: everyone pitches, everyone votes, lock in the winner.

Keyboard: `N` new task · `I` new idea · `J/K` move · `X` done · `C` claim · `⌫` delete · `?` help.

## Run it

```bash
npm install
npm run dev
```

With no configuration it runs in **demo mode**: rooms live in this browser and sync between its tabs.

## Live sync across devices (Supabase)

1. Create a Supabase project and run `supabase/migrations/0001_room_events.sql` in the SQL editor.
2. Copy `.env.example` to `.env.local` and fill in the project URL and anon (publishable) key.
3. Restart `npm run dev`.

Rooms are an append-only event log. Clients can only read or append a room through two RPCs, so knowing the room link is what grants access.

## Checks

```bash
npm test          # unit tests (state logic)
npm run e2e       # Playwright: create a room, sync to a second tab
npm run typecheck
npm run lint
```
