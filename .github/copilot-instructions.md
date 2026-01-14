<!-- Copilot instructions for the integrator monorepo -->

# Quick agent guide — integrator monorepo

Purpose: help an AI coding agent become productive quickly in this workspace.

1. Big picture

- **Monorepo**: managed with `pnpm` workspaces. Top-level projects live under `apps/` and shared code in `packages/`.
- **Backend**: `apps/api` — a NestJS app. Entry: `apps/api/src/main.ts`. App modules live under `apps/api/src/app/` (e.g. `app.module.ts`).
- **Admin UI**: `apps/admin` — Next.js (React + TypeScript). UI components are in `apps/admin/src/components`.
- **API client**: `packages/api-client` — generated client (Orval) used by frontends. Config: `packages/api-client/orval.config.js` and `packages/api-client/src/`.

2. Developer workflows (explicit, copy-paste commands)

- Initial environment (one-time):
  - `pnpm --parallel setup-env:dev`
  - `docker-compose up -d` (top-level `docker-compose.yml`) to bring up dependent services
- Run backend locally (recommended):
  - `pnpm -F api dev` (monorepo filter) or from `apps/api`: `pnpm run start:dev`
- Run admin UI locally:
  - `pnpm -F admin dev` or from `apps/admin`: `pnpm dev`
- Database migrations & seeds (APIs expect DB state):
  - Generate migration: `pnpm -F api migration:generate src/migrations/<MigrationName>`
  - Run migrations: `pnpm -F api migration:run`
  - Run seeds: `pnpm -F api seed:run` (see `apps/api/seeds/_run-seeds.ts`)
- API client generation (must run when backend is running):
  - `pnpm -F api-client generate`
  - This uses `orval` config at `packages/api-client/orval.config.js` and writes to `packages/api-client/src/`.

3. Tests & CI

- Backend tests: run from monorepo with filter: `pnpm -F api test` / `pnpm -F api test:e2e` / `pnpm -F api test:cov`.
- There is no global test runner; use per-package scripts.

4. Project-specific conventions & patterns

- Use pnpm workspace filtering (`-F <pkgName>`) rather than `cd` where possible. Examples above.
- Codegen dependency: frontend API client is generated from backend OpenAPI; generation requires a running backend.
- Nest modules are structured inside `apps/api/src/app/*`. Look for feature folders (e.g. `modules/`) and `decorators/`, `utils/` under the API to see cross-cutting patterns.
- Seeds & assets: `apps/api/seeds` and `apps/api/assets` hold initial data and binary assets (business/certificate). Use `seed:run` rather than manual DB edits.
- CLI entrypoints: see `apps/api/src/cli.ts` and `apps/api/src/main.ts` for differences between CLI-run vs HTTP server startup.

5. Integration points / external dependencies

- Docker services referenced in top-level `docker-compose.yml` (DB, maybe Redis, etc.). Confirm env variables in your env setup.
- Telemetry/third-party API clients live under `apps/api/src/utils/` and `modules/` — check `apps/api/src/app/` for providers wired into Nest DI.

6. Where to look for examples

- Start here for backend behavior: `apps/api/src/main.ts`, `apps/api/src/app/app.module.ts`, `apps/api/src/modules/`.
- Database-related tasks: `apps/api/ormconfig.ts`, `apps/api/src/migrations/`, `apps/api/seeds/`.
- API client generation: `packages/api-client/orval.config.js` and `packages/api-client/src/index.ts`.
- Frontend examples (auth/hooks): `apps/admin/src/hooks/` and UI components in `apps/admin/src/components/`.

7. Small gotchas for an agent

- When editing entities that affect the DB schema, update migrations. Run `migration:generate` then `migration:run` and validate seeds.
- API client generation expects the backend to be running on the host/port the orval config targets. If you change server ports, update `orval.config.js` or generate with explicit URL.
- Prefer small, focused edits. Follow existing NestJS DI patterns (providers, controllers, modules) instead of introducing non-idiomatic structure.
- Avoid changing global monorepo scripts unless necessary — prefer per-package scripts with `pnpm -F`.

8. Example quick tasks (copyable)

- Start backend, run migrations, generate client:
  - `pnpm -F api dev`
  - `pnpm -F api migration:run`
  - `pnpm -F api-client generate`

9. When in doubt — helpful files to open

- `README.md` (root) — contains primary dev commands
- `apps/api/README.md` — Nest run/test scripts
- `packages/api-client/orval.config.js` — check codegen details
- `apps/api/src/main.ts` and `apps/api/src/app/app.module.ts` — app wiring and providers

Please review and tell me if you'd like additional examples (e.g., typical PR scope, lint rules, or debugging steps for the Nest app).
