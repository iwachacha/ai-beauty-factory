# Factory Backend

Backend workspace for the AI Beauty Studio project.

## Main app

- `apps/factory-server`

## Install

```powershell
corepack pnpm install
```

## Quality commands

```powershell
corepack pnpm run lint:studio
corepack pnpm run lint:factory
corepack pnpm run test:factory
corepack pnpm run build:factory
```

`lint:studio` is the strict green-path lint used by the repository guardrails.
Use `corepack pnpm run lint:fix:factory` only when you explicitly want auto-fixes.

## Run locally

```powershell
corepack pnpm run serve:factory
```
