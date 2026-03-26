# Factory Server

Minimal personal SNS factory backend extracted from AiToEarn.

## Supported platforms

- `x`
- `instagram`
- `threads`
- `tiktok`
- `youtube`

## Core routes

- `POST /api/auth/login`
- `GET /api/accounts`
- `POST /api/accounts/connect/:platform`
- `GET /api/content/assets`
- `POST /api/content/assets`
- `GET /api/flows`
- `POST /api/flows`
- `POST /api/flows/:flowId/enqueue`
- `GET /api/jobs`
- `POST /api/jobs/:jobId/retry`
- `GET /api/settings/api-keys`

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

## Optional OAuth envs

- `TWITTER_CLIENT_ID`
- `TWITTER_CLIENT_SECRET`
- `INSTAGRAM_CLIENT_ID`
- `INSTAGRAM_CLIENT_SECRET`
- `THREADS_CLIENT_ID`
- `THREADS_CLIENT_SECRET`
- `TIKTOK_CLIENT_ID`
- `TIKTOK_CLIENT_SECRET`
- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
