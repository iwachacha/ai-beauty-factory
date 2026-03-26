# SNS Factory

個人用の「複数SNSアカウント自動運用工場」です。

この完成形は、AiToEarn 由来コードのうち必要部分だけを残し、以下の用途に絞って再構成しています。

- 複数媒体・複数アカウントの接続
- 素材管理
- flow 単位での横展開
- 予約投稿 / 即時投入
- ジョブ履歴
- 最低限のスナップショット保存
- モバイル優先の管理画面

対象媒体は v1 では以下のみです。

- `x`
- `instagram`
- `threads`
- `tiktok`
- `youtube`

中国系 SNS、課金、紹介、CRM、コメント自動化、マーケットプレイス、高度分析は含めていません。

## 構成

- `backend`
  - Nx + NestJS workspace
  - 実行 app は `apps/factory-server`
- `web`
  - Next.js 管理画面
  - 画面は `Accounts`, `Library`, `Flows`, `Queue`, `Settings`
- `docker-compose.yml`
  - 無料で扱いやすい `MongoDB + Valkey` の最小構成

## ローカル起動

前提:

- Node.js 24 系
- `corepack` が使えること
- Docker Desktop か互換環境

1. DB を起動します。

```powershell
docker compose up -d
```

2. backend 依存を入れます。

```powershell
cd backend
corepack pnpm install
```

3. web 依存を入れます。

```powershell
cd ../web
npm install
```

4. backend を build します。

```powershell
cd ../backend
corepack pnpm run build:factory
```

5. backend と web を起動します。

```powershell
cd ..
powershell -ExecutionPolicy Bypass -File .\scripts\start-backend.ps1
```

別ターミナル:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-web.ps1
```

6. 管理画面を開きます。

- `http://localhost:6070/accounts`
- 既定ログイン:
  - email: `admin@example.com`
  - password: `changeme123`

## 補足

- backend は `relay` や公式 hosted service に依存しません。
- queue は BullMQ 常駐 worker ではなく、個人運用向けの軽量ローカルキューに差し替えています。
- web は API の `code/data/message` envelope を解釈して、非 0 code をエラー表示します。
- web は Google Fonts 依存を外してあるので、build が軽く、外部フォント取得にも依存しません。

## ライセンス

- ルートの `LICENSE.txt` は MIT です。
- ただし、AiToEarn の hosted service / relay / 利用規約は別物です。この完成形ではそれらに依存しない構成にしています。
