# AI Beauty Monetization Factory

AI美女（AIインフルエンサー）を用いた複数SNS・Fanvueアカウントでの収益化とエンゲージメント獲得を自動化・効率化する「AI美女運用専用工場」ダッシュボードです。

元々の汎用版 `sns-factory` から分岐し、AI美女の「キャラクター設計」「独自プロンプト管理（チラリズム/フェチ）」「画像生成API連携」に特化した構成となっています。

## 構成

- `backend`
  - Nx + NestJS workspace (MongoDB連携)
  - 実行 app は `apps/factory-server`
  - 主な機能: `Characters`, `Templates`, `Calendar`, `Monetization`, `ComfyUI Job` 管理
- `web`
  - Next.js 管理画面
  - 画面: 
    - `/characters`: AIモデル管理
    - `/templates`: シーンやプロンプト (フェチ要素等) DB
    - `/monetization`: 配信・収益プラットフォーム一覧
    - `/calendar`: 投稿スケジュール
- `scripts`
  - ComfyUI API呼び出し用の Python スクリプト (`batch_generate.py`) 等
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

- `http://localhost:6070/characters`
- 既定ログイン:
  - email: `admin@example.com`
  - password: `changeme123`

## プロンプトと実装ルール
詳細は `walkthrough.md` を参照してください。

## ライセンス

- ルートの `LICENSE.txt` は MIT です。
