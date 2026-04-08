# Studio Web

Next.js operator UI for the lean X -> Fanvue control room.

## Main routes

- `/setup`
- `/ops`
- `/insights`
- `/settings`

Legacy routes such as `/review`, `/publish`, `/generate`, `/characters`, `/templates`, `/accounts`, `/library`, `/flows`, `/queue`, `/calendar`, and `/monetization` are intentionally removed and should return `404`.

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
npm run test:e2e:studio
npm run verify
```

`npm run verify` runs the full local web verification sequence used by the repository guardrails.
`npm run test:e2e:studio` runs the browser-only `setup -> ops -> insights` flow against an already running stack.
`npm run dev` and `npm run build` intentionally use webpack so the UI can import the shared Studio contracts from `../backend/libs/studio-contracts/src/index.ts`.
