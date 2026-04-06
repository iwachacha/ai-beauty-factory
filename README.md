# AI Beauty Studio

Single-operator studio for running one X account with a semi-automatic workflow:

`Character -> Template -> ComfyUI generation -> Human review -> Publish package -> Manual post -> Insights`

## What is in this repo

- `backend`
  - Nx + NestJS workspace
  - Main app: `apps/factory-server`
  - New Studio API lives under `backend/apps/factory-server/src/studio`
- `web`
  - Next.js admin UI
  - Main routes:
    - `/characters`
    - `/templates`
    - `/generate`
    - `/review`
    - `/publish`
    - `/insights`
    - `/settings`
- `scripts`
  - local start scripts
  - Studio smoke test
  - ComfyUI workflow + mock server
- `walkthrough.md`
  - concept and intended operating model

## Local setup

Requirements:

- Node.js 24+
- `corepack`
- Docker-compatible local runtime for optional local smoke rehearsal

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

6. Start backend and web.

```powershell
cd ..
powershell -ExecutionPolicy Bypass -File .\scripts\start-backend.ps1
```

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-web.ps1
```

7. Open the studio UI.

- `http://localhost:6070/review`
- login values come from `FACTORY_ADMIN_EMAIL` and `FACTORY_ADMIN_PASSWORD`
- if those envs are unset, the local defaults are:
  - email: `admin@example.com`
  - password: `changeme123`

## Smoke test

The smoke script now exercises the Studio v1 flow end to end:

- login
- seed one local X account
- activate the account
- create character and template
- run generation through a mock ComfyUI server
- approve the generated asset
- create a content draft
- export a publish package
- record a published post
- verify insights and the review page shell

Run it after backend/web are built:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smoke.ps1
```

`verify-full` uses the same smoke flow. A Docker-compatible local runtime is only needed when you want to rehearse the heavy runtime checks locally.

## Guardrails

The repository now treats verification as part of the deliverable.

- `AGENTS.md`
  - top-level operating rules for autonomous delivery in this repo
- `scripts/verify-fast.ps1`
  - required for every change and before each push
- `scripts/verify-full.ps1`
  - optional local rehearsal for runtime flows when local infrastructure is available
- `.github/workflows/quality.yml`
  - always runs `verify-fast`
  - escalates to API smoke for runtime/CI changes
  - escalates to browser E2E for major user-facing flow changes
- `.githooks/pre-commit`
  - runs `verify-fast`
- `.githooks/pre-push`
  - runs `verify-fast` and relies on GitHub Actions for heavy tiers

### Daily flow

1. Branch from the latest `main`.
2. Make the change.
3. Run `powershell -ExecutionPolicy Bypass -File .\scripts\verify-fast.ps1`.
4. Run `powershell -ExecutionPolicy Bypass -File .\scripts\verify-full.ps1` when you need a local runtime rehearsal and infrastructure is available.
5. Push the feature branch.
6. Wait for GitHub Actions to finish the required tier for that diff: fast, smoke, or browser.
7. Open or update the PR with the verification evidence.
