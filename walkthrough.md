# AI美女裏垢 収益化プロジェクト — ウォークスルー

## Phase 0: 基盤整備 ✅ 完了

**ブランチ**: `feature/ai-beauty-monetization`
**コミット**: `1d56072` — `feat: Phase 0 - AI beauty monetization foundation`

---

## 作成したファイル一覧

```
c:\monetization\
├── .agents/skills/generate-beauty-prompt/
│   ├── SKILL.md                              # プロンプト生成SKILLメイン
│   ├── resources/
│   │   ├── prompt-blocks.json                # キャラ・修飾子・カメラDB
│   │   └── scene-templates.json              # 30シーンのテンプレート集
│   └── examples/
│       ├── example-zettai-ryouiki.md         # 絶対領域プロンプト例
│       ├── example-wet-sheer.md              # 濡れ透けプロンプト例
│       └── example-yukata.md                 # 浴衣隙間プロンプト例
├── docs/characters/
│   ├── character-bible.md                    # キャラクター設計書(4人)
│   └── quality-checklist.md                  # 品質管理チェックリスト
└── .gitignore                                # 更新済み
```

---

## 成果物の詳細

### 1. プロンプト生成SKILL

[SKILL.md](file:///c:/monetization/.agents/skills/generate-beauty-prompt/SKILL.md)

キャラ設定×シーン×衣装×フェチ要素の入力パラメータから、ComfyUI/SD用の完全なプロンプトセットを自動構築するSKILL。

**対応するチラリズム/フェチ修飾子: 13種**

| カテゴリ | 修飾子 |
|---------|--------|
| チラリズム (6種) | 絶対領域、オフショル、浴衣隙間、風スカート、バックライン、クロスレッグ |
| フェチ (7種) | 濡れ透け、汗ばみ、首筋汗、タオル巻き、雨濡れ髪、朝ストレッチ、入浴 |

### 2. プロンプトブロックDB

[prompt-blocks.json](file:///c:/monetization/.agents/skills/generate-beauty-prompt/resources/prompt-blocks.json)

| セクション | 件数 |
|-----------|------|
| キャラクター定義 | 4人 (Yuna, Soojin, Mei, Riko) |
| チラリズム修飾子 | 6種 |
| フェチ修飾子 | 7種 |
| カメラプリセット | 5種 (low_angle, eye_level, from_behind, close_up, full_body) |
| ムードプリセット | 7種 (casual_daily, golden_hour, rainy_day, night_city, summer_heat, summer_festival, morning_light) |
| ネガティブプロンプト | 3パターン (base, sfw_addition, fetish_limits) |

### 3. シーンテンプレート

[scene-templates.json](file:///c:/monetization/.agents/skills/generate-beauty-prompt/resources/scene-templates.json)

| カテゴリ | シーン数 | 代表例 |
|---------|---------|--------|
| オフィス | 5 | 書類拾い、デスクストレッチ、靴直し |
| 通勤・街 | 5 | 電車吊り革、突然の雨、ベンチで涼む |
| カフェ | 4 | 足組み窓席、バリスタ、読書 |
| 自宅 | 6 | 朝ストレッチ、お風呂上がり、ヨガ |
| 屋外 | 4 | 猫撫で、川沿い散歩、スプリンクラー |
| 季節 | 6 | 夏祭り、桜、バレンタイン、ビーチ |

### 4. キャラクター設計書

[character-bible.md](file:///c:/monetization/docs/characters/character-bible.md)

| キャラ | 国籍 | 職業 | 得意フェチ | ティア主戦場 |
|--------|------|------|-----------|------------|
| Yuna 🇯🇵 | 日本 | IT企業OL | 絶対領域、汗ばみ | free_sns主体 |
| Soojin 🇰🇷 | 韓国 | カフェ店員 | 濡れ透け、風スカート | subscriber |
| Mei 🇹🇼 | 台湾 | 大学院生 | 浴衣隙間、朝ストレッチ | free_sns主体 |
| Riko 🇯🇵 | 日本 | 看護師 | 濡れ白衣、タオル巻き | subscriber/premium |

### 5. 品質管理チェックリスト

[quality-checklist.md](file:///c:/monetization/docs/characters/quality-checklist.md)

7カテゴリ・全25項目の目視確認チェックリスト:
1. 顔の一貫性 (4項目)
2. 解剖学的正確さ (5項目)
3. AI感の排除 (5項目)
4. 衣装と小道具 (4項目)
5. 背景と構図 (4項目)
6. 規約適合性 (5項目)
7. 技術品質 (4項目)

---

## 次のステップ: Phase 1（画像生成パイプライン）

Phase 1 では以下を実施:

1. **RunPod環境構築** — ComfyUI + カスタムノード群をクラウドGPU上にセットアップ
2. **モデル/LoRA選定** — Civitaiでフォトリアリスティック系モデルを調査・テスト
3. **4キャラのリファレンス画像生成** — IP-Adapter FaceID用のアンカー画像セット(各3枚)
4. **バッチ生成ワークフロー** — ComfyUI APIを使ったPythonスクリプトで一括生成

### 実装状況 (Phase 1)
- ✅ `scripts/comfyui/workflow_api.json`: ComfyUIバッチ処理用のワークフローの基盤を作成
- ✅ `scripts/comfyui/batch_generate.py`: ComfyUIのAPIを利用し、プロンプトを差し替えて連続生成するPythonスクリプトを作成

## 次のステップ: Phase 2（バックエンド統合）

- [x] バッチ処理テスト (Mockup implementation)
- **バックエンド統合準備 (Phase 2)**:
  - MongoDB スキーマ実装 (Characters, Templates, Calendar, Monetization, ComfyuiJob)
  - `libs/mongodb` モジュールへの統合
  - CRUD機能を持つ各種サービス/コントローラーの実装 (`factory-beauty-characters`, `factory-beauty-templates`, `factory-beauty-calendar`, `factory-beauty-monetization`)
  - ComfyUI API呼び出し用のダミーサービス実装 (`factory-beauty-comfyui`)
  - `FactoryModule` へのサービス/コントローラー全登録
  - バックエンドビルドの正常完了を確認 (`pnpm run build:factory`)
- **フロントエンドダッシュボード統合**:
  - `factory-shell.tsx`のナビゲーションに「キャラクター」「テンプレート」「配信・収益」「カレンダー」を追加。モバイル向けのスクロール表示修正。
  - Next.jsページの雛形作成:
    - `/characters`: APIと連携したAIモデルの一覧
    - `/templates`: シーンやプロンプトのDB一覧
    - `/calendar`: キャラ別・日別の投稿スケジュール一覧
    - `/monetization`: プラットフォーム別収益データのレポーティング一覧
  - フロントエンドビルドの正常完了を確認 (`pnpm run build`)

## 次のステップ
- **本番インフラ構築**: RunPodでのGPU環境の準備と、ComfyUIモデル/LoRAのセットアップ。
- **テスト生成の実施**: 開発したスクリプトを用いて、各キャラの画像生成テスト（5枚×3シーン）と品質チェックを実施。
- **初回プロンプト投入**: Fanvue・無料SNS向けに、DBから選定したテンプレートを用いてのコンテンツ自動生成。

-- End of Report --

> **[💡 User Action Required]**
> RunPod環境構築、および対象モデルやLoRAのダウンロードはローカルコンテキスト外の作業となります。
> ComfyUI サーバーのURL（`COMFYUI_SERVER_ADDRESS`）が利用可能であれば共有してください。テストスクリプトを実行し、実際に画像を生成します。

---

## 検証結果

| 項目 | 結果 |
|------|------|
| ブランチ作成 | ✅ `feature/ai-beauty-monetization` |
| SKILL構文 | ✅ YAML frontmatter + markdown 形式 |
| JSON構文 | ✅ `prompt-blocks.json`, `scene-templates.json` 正常 |
| gitignore | ✅ モデル/生成画像の除外設定追加 |
| コミット | ✅ `1d56072` |
| Pythonスクリプト | ✅ `scripts/comfyui/batch_generate.py` |
| ComfyUI Workflow | ✅ `scripts/comfyui/workflow_api.json` |
