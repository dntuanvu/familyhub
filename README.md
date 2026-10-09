# Family Hub

Routine, reward, and calendar tracker for kids. Monorepo with:

```
apps/api        NestJS + Prisma + Postgres (auth, CRUD, star balance, redemption rules)
apps/web        Vite + React + React Query (parent/web UI)
apps/mobile     Expo + React Native (iPad/phone UI)
packages/core   Shared zod schemas and star/reward/recurrence logic
```

## Prereqs

- Node 20+
- pnpm 9
- Docker (for the Postgres container) — or any Postgres 15+

## Setup

```bash
pnpm install

# 1. Start Postgres
pnpm db:up

# 2. Configure the API
cp apps/api/.env.example apps/api/.env
# edit DATABASE_URL / JWT secrets as needed

# 3. Apply the schema
pnpm prisma:generate
pnpm prisma:migrate            # creates the initial migration + applies it

# 4. Run the three dev servers (in separate terminals)
pnpm dev:api                   # http://localhost:3001/api  (swagger at /docs)
pnpm dev:web                   # http://localhost:5173
pnpm dev:mobile                # Expo dev server
```

The mobile app reads `extra.apiUrl` from `app.json`. For a device, change it to your LAN IP (`http://192.168.x.x:3001/api`). The web app reads `VITE_API_URL` (default `http://localhost:3001/api`).

## Architecture notes

**Family isolation.** Every row carries `family_id`. The `JwtAuthGuard` loads the caller's memberships; `resolveFamilyScope` picks the family from a `familyId` query/body/param or (if there's exactly one) defaults to it. Non-members get 403.

**Parent-only writes.** `requireParent(scope)` guards members, rewards, redemption decisions, and star adjustments.

**Star balance.** Reconstructed server-side (see `star-balance/compute.ts`) with the same rule as the original SQL view: `earned + adjusted - spent`, counting pending redemptions as spent so stars can't be double-booked.

**Redemption rules.** Enforced in `RedemptionsService.request`:
- reward must be active
- member balance must cover `star_cost` (snapshot at request time)
- `max_per_week` is counted in the family's timezone, Monday-start

Decisions are terminal (controller rejects re-decides).

**Shared types.** `@family-hub/core` holds the zod schemas and types used by backend, web, and mobile. Column names use snake_case to match what the API returns.

## Scripts

| Command | What |
|---|---|
| `pnpm dev:api` | NestJS on 3001 |
| `pnpm dev:web` | Vite on 5173 |
| `pnpm dev:mobile` | Expo dev server |
| `pnpm prisma:migrate` | create+apply dev migration |
| `pnpm prisma:generate` | regen Prisma client |
| `pnpm db:up` / `pnpm db:down` | local Postgres via Docker |
| `pnpm typecheck` / `pnpm test` | all workspaces |
