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
- Docker Desktop

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

## Guardrails

The repository now treats verification as part of the deliverable.

- `AGENTS.md`
  - top-level operating rules for autonomous delivery in this repo
- `scripts/verify-fast.ps1`
  - required for normal code/config/doc/script changes
- `scripts/verify-full.ps1`
  - required before push and for user-facing flow, persistence, CI, hook, publish, review, or generation changes
- `.githooks/pre-commit`
  - runs `verify-fast`
- `.githooks/pre-push`
  - runs `verify-full`
- `.github/workflows/quality.yml`
  - runs `verify-fast` on GitHub Actions

### Daily flow

1. Branch from the latest `main`.
2. Make the change.
3. Run `powershell -ExecutionPolicy Bypass -File .\scripts\verify-fast.ps1`.
4. Before push, run `powershell -ExecutionPolicy Bypass -File .\scripts\verify-full.ps1`.
5. Push the feature branch and open a PR with the verification evidence.
