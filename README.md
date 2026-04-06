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

4. Build backend and web.

```powershell
cd ../backend
corepack pnpm run build:factory
cd ../web
npm run build
```

5. Start backend and web.

```powershell
cd ..
powershell -ExecutionPolicy Bypass -File .\scripts\start-backend.ps1
```

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-web.ps1
```

6. Open the studio UI.

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
