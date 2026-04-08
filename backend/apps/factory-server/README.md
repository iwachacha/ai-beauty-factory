# Factory Server

NestJS backend for the Studio v1 X -> Fanvue operating loop.

Shared Studio contracts live in `backend/libs/studio-contracts/src/index.ts` and are re-exported by `src/studio/studio.contracts.ts`.

## Studio routes

- `POST /api/auth/login`
- `GET /api/studio/v1/operator-config`
- `POST /api/studio/v1/operator-config`
- `GET /api/studio/v1/characters`
- `POST /api/studio/v1/characters`
- `GET /api/studio/v1/templates`
- `POST /api/studio/v1/templates`
- `GET /api/studio/v1/channel-account`
- `POST /api/studio/v1/channel-account`
- `GET /api/studio/v1/generation-runs`
- `GET /api/studio/v1/generation-runs/:runId`
- `POST /api/studio/v1/generation-runs`
- `GET /api/studio/v1/generated-assets`
- `POST /api/studio/v1/generated-assets/:generatedAssetId/review`
- `GET /api/studio/v1/content-drafts`
- `POST /api/studio/v1/content-drafts`
- `GET /api/studio/v1/public-post-packages`
- `POST /api/studio/v1/public-post-packages`
- `GET /api/studio/v1/paid-offer-packages`
- `POST /api/studio/v1/paid-offer-packages`
- `POST /api/studio/v1/funnel-metrics`
- `GET /api/studio/v1/insights`

## Supporting routes

- `GET /api/accounts`
- `POST /api/accounts/connect/:platform`
- `GET /api/settings/api-keys`
- `POST /api/settings/api-keys`

## Required envs

- `MONGODB_HOST`
- `MONGODB_PORT`
- `REDIS_HOST`
- `REDIS_PORT`
- `JWT_SECRET`
- `INTERNAL_TOKEN`
- `FACTORY_ADMIN_EMAIL`
- `FACTORY_ADMIN_PASSWORD`
- `FACTORY_ADMIN_NAME`

## Optional envs

- `TWITTER_CLIENT_ID`
- `TWITTER_CLIENT_SECRET`
- `COMFYUI_SERVER_ADDRESS`
- `COMFYUI_WORKFLOW_PATH`
- `COMFYUI_MODEL`
- `COMFYUI_WIDTH`
- `COMFYUI_HEIGHT`
