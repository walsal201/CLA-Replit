# The Child Lost Agency (CLA) Portal

A full-featured Canadian child protection agency operations portal — The Child Lost Agency (CLA) — with GPS tracking, AI-powered case management, drone/robot fleet monitoring, and a secure agent portal.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied to /api)
- `pnpm --filter @workspace/cla-portal run dev` — run the React frontend (port 22269, proxied to /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `OPENAI_API_KEY` — for all 6 AI endpoints

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + TailwindCSS + shadcn/ui + wouter routing
- API: Express 5 (api-server artifact at /api)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Maps: Leaflet (GPS Live Tracker section)
- AI: Direct OpenAI API (gpt-4o-mini), 6 endpoints

## Where things live

- `artifacts/cla-portal/src/` — React frontend
  - `pages/Home.tsx` — main SPA page with all section imports
  - `components/sections/` — all page sections (HeroBanner, AboutAgency, Services, Technology, MissingBoard, ReportForm, Enrollment, LiveTracker, AgentPortal, SystemStatus)
  - `components/layout/Navbar.tsx` — sticky navigation
  - `components/AiVirtualAgent.tsx` — floating AI chat widget
- `artifacts/api-server/src/routes/` — backend routes
  - `cases.ts` — CRUD for missing child cases
  - `ai.ts` — 6 AI endpoints (chat, case-analysis, emergency-alert, maintenance, battery, threat)
- `lib/db/src/schema/cases.ts` — cases DB schema (Drizzle)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)

## Architecture decisions

- OpenAPI-first: all API contracts defined in openapi.yaml, codegen produces React Query hooks + Zod schemas
- Cases persisted in PostgreSQL via Drizzle (not localStorage like original)
- AI endpoints call OpenAI directly (gpt-4o-mini) with agency-specific system prompts
- Dark mode only — enforced via `document.documentElement.classList.add("dark")` in App.tsx
- All routes served through the shared Replit reverse proxy (path-based routing)

## Product

- **Public sections**: Hero stats, Agency about, Services, Technology & equipment, Toronto City Network, Missing Children board
- **Report Form**: Submit missing child cases (stored in PostgreSQL), returns CLA case ID
- **Enrollment Plans**: Basic $29/mo, Family $59/mo, Elite $99/mo with mock checkout flow
- **GPS Live Tracker**: Leaflet map simulator — child marker moves across Toronto, drone overlays, telemetry data, multi-session support
- **Agent Secure Portal**: Login-gated case database, stats dashboard, AI case analysis, emergency alert generation
- **System Status & Maintenance**: Operational status cards, AI-generated maintenance reports
- **AI Virtual Agent**: Floating chat widget (bottom-right), powered by OpenAI gpt-4o-mini with agency context

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm run typecheck:libs` after editing `lib/db/schema/` before typechecking artifact packages
- Orval-generated query hooks require `queryKey` in the query options object when using `enabled`
- Leaflet CSS must be imported in the component (not just the JS) for the map to render correctly
- The AI chat messages array is sent with each request (stateless backend, client holds history)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- Original design reference: dark navy (#001133), Canadian red (#CC0000), amber warnings
- Head Officer: Walid Ibrahim, ID: 000539337, founded 2010, Toronto
