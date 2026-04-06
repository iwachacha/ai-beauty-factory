# Studio Web

Next.js admin UI for the Studio v1 workflow.

## Main routes

- `/review`
- `/generate`
- `/publish`
- `/insights`
- `/characters`
- `/templates`
- `/settings`

Legacy routes such as `/accounts`, `/library`, `/flows`, `/queue`, `/calendar`, and `/monetization` now redirect into the Studio workflow.

## Environment

- `NEXT_PUBLIC_FACTORY_API_URL`

Default:

```text
http://localhost:3012/api
```

## Quality commands

```powershell
npm run typecheck
npm run test
npm run build
npm run verify
```

`npm run verify` runs the full local web verification sequence used by the repository guardrails.
