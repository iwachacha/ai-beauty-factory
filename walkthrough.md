# AI Beauty Studio Walkthrough

## Product shape

このリポジトリの v1 は、1つの公開 X アカウントと 1つの有料 Fanvue 導線だけに絞った運用室です。
目的は「画面を増やすこと」ではなく、次のループを短く、確実に回すことです。

`Setup -> Ops -> Insights -> Settings`

## Four surfaces

### `/setup`

- キャラクターバイブル
- プロンプトテンプレート
- 公開側 CTA / ハッシュタグ / チェックリスト
- 公開安全ラインと有料側ガイドライン

### `/ops`

- 生成
- レビュー
- `public_safe` / `paid_only` のルーティング
- 公開 X パッケージの作成
- 有料 Fanvue パッケージの作成

### `/insights`

- 公開側メトリクス
- 有料側メトリクス
- クリックから売上までのファネル記録

### `/settings`

- 認証
- API base
- X 接続とアクティブ化
- Fanvue の手動エクスポート先

## Core objects

- `StudioOperatorConfig`
  - 公開側と有料側の基本方針
- `StudioGeneratedAsset`
  - レビュー結果に加えて `surfaceFit` を持つ
- `StudioContentDraft`
  - 公開文面と有料文面を同居させた下書き
- `PublicPostPackage`
  - X に出すための公開パッケージ
- `PaidOfferPackage`
  - Fanvue に出すための有料パッケージ
- `FunnelMetrics`
  - 公開反応と有料成果を1レコードで追う

## Review policy

- 承認だけでは足りません
- 承認済みアセットは必ず `public_safe` か `paid_only` のどちらかに振り分けます
- `paid_only` は公開 X パッケージ化を禁止します
- 公開 X パッケージはアクティブな X アカウントがないと作れません

## Verification expectations

- `scripts/verify-fast.ps1`
  - すべての変更で必須
- `scripts/verify-full.ps1`
  - Docker 互換ランタイムがある時だけローカルで実行
- smoke / browser verification
  - 旧ルートが `404`
  - 未承認アセットの下書き化が拒否される
  - X 未接続状態で公開エクスポートが拒否される
  - `paid_only` が公開エクスポートを拒否される
  - `setup -> ops -> insights` の主導線が通る

## Non-goals for v1

- 複数公開チャネルの同時運用
- Fanvue への直接自動投稿
- 旧 `/review` `/publish` `/generate` `/characters` `/templates` UI の維持
- 使われていない旧 beauty 専用 API の温存
