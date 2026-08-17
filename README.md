# Jamot

Jamot is the backend (and cockpit frontend) for a human-centered, AI-native platform where a **Person or Organization can discover, manage, execute, learn from, and monetize problem-solving capabilities**.

It is a **universal organizational kernel** — not an agent runtime, CRM, ERP, or messaging app. External systems (Letta, Honcho, Graphiti, Hermes, OpenClaw, OpenManus, Matrix, MCP, …) are replaceable implementations behind Jamot interfaces.

> **Jamot owns identity, relationships, permissions, organizational state, capability contracts and governance. External systems provide specialized cognition, communication, execution and knowledge infrastructure.**

> **Source of truth:** [`JAMOT_SPEC.md`](./JAMOT_SPEC.md) is the authoritative product/spec document for this repository. Design decisions and implementations must stay consistent with it.

## Monorepo layout

```
J-01/
├── apps/web/            Next.js 16 cockpit UI (CopilotKit v2, three-pane shell)
├── packages/contracts/  Shared Zod domain contracts (the single source of truth for types)
├── packages/core/       Domain layer: Drizzle schema, events, policy engine, repositories,
│                        memory/knowledge, LLM + routing, apps/resolver, channels,
│                        scheduler, reputation, treasury, harness, MCP
├── packages/api/        Fastify REST API + session auth + Google OAuth + RBAC
├── packages/workers/    Background processes: scheduler/heartbeats, channel adapters
│                        (WhatsApp via Baileys, Matrix via matrix-js-sdk)
└── packages/sdk/        App SDK manifest types
```

## Tech stack

- **Backend**: Node 22, TypeScript (ESM), Fastify, Drizzle + PostgreSQL 16, Redis/BullMQ, Zod
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind v4, CopilotKit v2 (AG-UI + A2UI)
- **Package manager**: pnpm workspaces

## Prerequisites

- Node.js ≥ 22, pnpm ≥ 9 (`corepack enable`)
- Docker (for local Postgres + Redis + Synapse)

## Setup

```bash
corepack enable
pnpm install

# local infrastructure (Postgres on :5433, Redis on :6379, Synapse on :8008)
docker compose up -d postgres redis

cp .env.example .env   # fill in SESSION_SECRET, LLM keys, Google OAuth, etc.

# apply migrations (manual psql; see packages/core/src/migrations/)
cat packages/core/src/migrations/0001_init.sql \
    packages/core/src/migrations/0002_memory_knowledge.sql \
    packages/core/src/migrations/0003_reputation_treasury.sql \
    packages/core/src/migrations/0004_users.sql \
  | docker exec -i jamot-postgres psql -U jamot -d jamot -v ON_ERROR_STOP=1 -f -
```

## Run

```bash
# API (http://localhost:4000) — uses Postgres when DATABASE_URL is set, else in-memory
pnpm --filter @jamot/api dev

# Web (http://localhost:3000) — set NEXT_PUBLIC_API_URL to point at the API
NEXT_PUBLIC_API_URL=http://localhost:4000 pnpm --filter @jamot/web dev

# Scheduler / heartbeat worker
pnpm --filter @jamot/workers dev:scheduler

# Channel worker (WhatsApp QR / Matrix bot) — requires credentials
pnpm --filter @jamot/workers dev:channel
```

WhatsApp pairing: the channel worker runs a small control server that the API proxies
for the `/whatsapp` UI. Point the API at it via `WA_WORKER_URL` (defaults unset → 503).

```bash
# API .env
WA_WORKER_URL=http://localhost:3001
```

If a session is logged out or corrupted, use the **Reset pairing** button in the
WhatsApp app (calls `POST /api/wa/reset`, which wipes the session dir and starts a
fresh QR).

## Scripts

```bash
pnpm -r typecheck   # typecheck all packages
pnpm -r test        # run all tests (vitest)
pnpm -r build       # build all packages
```

## API surface

`/api/health`, `/actors`, `/people`, `/organizations`, `/spaces`, `/roles`, `/tasks`, `/auth` (login/logout/me + `/auth/google` OAuth), `/agents` (+ `/agents/import-mcp`), `/skills`, `/connectors`, `/capabilities`, `/vault`, `/channels`, `/apps` (+ `/apps/resolve`), `/memory`, `/knowledge`, `/reputation`, `/treasury`, `/routing/intent`, `/tasks/:id/assign`.

## Environment variables

See `.env.example`. Key vars: `DATABASE_URL`, `SESSION_SECRET`, `SECRET_ENCRYPTION_KEY`, `OPENAI_API_KEY`/`ANTHROPIC_API_KEY` (LLM), `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`GOOGLE_REDIRECT_URI`/`FRONTEND_URL` (OAuth), `WHATSAPP_SESSION_DIR`/`MATRIX_*` (channels).

## Status

Backend phases P1–P9 and frontend F1–F8 are implemented against the MVP boundary (Personal/Organization spaces, People, Agents, Main Manager routing, WhatsApp/Matrix/MCP, Skills, Connectors, Tasks, Memory, CopilotKit, App SDK, one external-agent import, reputation, treasury, scheduler/heartbeats). Channel + LLM connections require live credentials.

## Deployment (Render)

Live:

- API — https://jamot-api.onrender.com
- Web — https://jamot-web.onrender.com
- Postgres — `jamot-ts-db` (oregon, basic_256mb)
- Scheduler worker — `jamot-scheduler`

Migrations run automatically on deploy via `preDeployCommand` (`pnpm --filter @jamot/core exec tsx scripts/migrate.ts`), tracked in a `schema_migrations` table.

### Google OAuth

1. Create an OAuth 2.0 **web application** client in Google Cloud Console.
2. Add authorized redirect URI: `https://jamot-api.onrender.com/api/auth/google/callback`.
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` on the `jamot-api` service (Dashboard → jamot-api → Environment).

`GOOGLE_REDIRECT_URI` and `FRONTEND_URL` are already set on the service.
