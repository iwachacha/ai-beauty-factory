# AI Beauty Studio

Lean control room for one safe public X account and one paid Fanvue destination.

Core loop:

`Setup -> Ops -> Insights -> Settings`

## What is in this repo

- `backend`
  - Nx + NestJS workspace
  - Main app: `apps/factory-server`
  - Studio API lives under `backend/apps/factory-server/src/studio`
- `web`
  - Next.js operator UI
  - Main routes:
    - `/setup`
    - `/ops`
    - `/insights`
    - `/settings`
  - `web/lib/studio-contracts.ts` re-exports the shared Studio contracts from `backend/libs/studio-contracts/src/index.ts`
- `scripts`
  - local start scripts
  - Studio smoke verification
  - ComfyUI workflow + mock server
- `walkthrough.md`
  - product model and operator workflow

Legacy studio routes such as `/review`, `/publish`, `/generate`, `/characters`, and `/templates` are intentionally removed and should return `404`.

## Local setup

Requirements:

- Node.js 24+
- `corepack`
- Docker-compatible local runtime when you want to rehearse the optional heavy verification locally

1. Start MongoDB and Valkey.

```powershell
docker compose up -d
```

2. Install backend dependencies.

```powershell
cd backend
corepack pnpm install
```

3. Install web dependencies.

```powershell
cd ../web
npm install
```

4. Install the local git hooks.

```powershell
cd ..
powershell -ExecutionPolicy Bypass -File .\scripts\install-git-hooks.ps1
```

5. Build backend and web.

```powershell
cd .\backend
corepack pnpm run build:factory
cd ..\web
npm run build
```

The web build is intentionally pinned to webpack so the shared Studio contract source can be imported directly from `../backend`.

6. Start backend and web.

```powershell
cd ..
powershell -ExecutionPolicy Bypass -File .\scripts\start-backend.ps1
```

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-web.ps1
```

7. Open the control room.

- `http://localhost:6070/ops`
- login values come from `FACTORY_ADMIN_EMAIL` and `FACTORY_ADMIN_PASSWORD`
- if those envs are unset, the local defaults are:
  - email: `admin@example.com`
  - password: `changeme123`

## Smoke verification

The smoke verification now exercises the rebuilt X -> Fanvue loop end to end:

- login
- verify removed legacy routes return `404`
- verify negative API flows:
  - unapproved assets cannot become drafts
  - public export is blocked without an active X account
  - `paid_only` assets are blocked from public package export
- seed one local X account and activate it
- create a character and template
- run generation through a mock ComfyUI server
- approve the generated asset and route it as `public_safe`
- create a dual-surface draft
- export an X public package
- export a Fanvue paid package
- record funnel metrics
- verify insights and the `/ops` shell

Run it after backend and web are built:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smoke.ps1
```

`verify-full` uses the same stack plus browser E2E. A Docker-compatible local runtime is only needed when you want to rehearse those heavier runtime checks locally.

## Guardrails

The repository treats verification as part of the deliverable.

- `AGENTS.md`
  - top-level operating rules for autonomous delivery in this repo
- `docs/spec-alignment-checklist.md`
  - mandatory non-technical question checklist for non-trivial work
- `scripts/verify-fast.ps1`
  - required for every change and before each push
- `scripts/verify-full.ps1`
  - optional local rehearsal for runtime flows when local infrastructure is available
- `.github/workflows/quality.yml`
  - always runs `verify-fast`
  - escalates to API smoke for runtime and CI changes
  - escalates to browser E2E for major user-facing flow changes
- `.githooks/pre-commit`
  - runs `verify-fast`
- `.githooks/pre-push`
  - runs `verify-fast` and relies on GitHub Actions for heavy tiers

### Daily flow

1. Align on the product direction for non-trivial work using `docs/spec-alignment-checklist.md`.
2. Branch from the latest `main`.
3. Make the smallest safe change.
4. Run `powershell -ExecutionPolicy Bypass -File .\scripts\verify-fast.ps1`.
5. Run `powershell -ExecutionPolicy Bypass -File .\scripts\verify-full.ps1` when local runtime infrastructure is available and you need the full rehearsal.
6. Push the feature branch.
7. Wait for GitHub Actions to finish the required tier for that diff: fast, smoke, or browser.
8. Carry the verification evidence into the PR.
