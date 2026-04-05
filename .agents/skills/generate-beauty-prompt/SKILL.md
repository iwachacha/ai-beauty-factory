---
name: generate-beauty-prompt
description: AI美女キャラクターの画像生成プロンプトを、キャラ設定・シチュエーション・衣装・フェチ要素から自動構築する
---

# AI美女プロンプト生成 SKILL

## 概要

このSKILLは、定義済みキャラクター設定とシーンテンプレートを組み合わせて、
ComfyUI / Stable Diffusion 用の高品質フォトリアリスティックプロンプトを自動生成する。

## 使い方

ユーザーから以下のパラメータを受け取り、完全なプロンプトセットを出力する。

### 入力パラメータ

| パラメータ | 必須 | 説明 | 例 |
|-----------|------|------|-----|
| `character` | ✅ | キャラクター名 | `yuna`, `soojin`, `mei`, `riko` |
| `scene` | ✅ | シチュエーション | `オフィスで書類を拾う` or テンプレートID |
| `outfit` | ○ | 衣装指定（省略時はキャラデフォルト） | `タイトスカート、黒ストッキング` |
| `chiralism` | ✅ | チラリズム/フェチの種別 | 下記カタログ参照 |
| `camera` | ○ | カメラアングル（デフォルト: `eye_level`） | `low_angle`, `from_behind` |
| `mood` | ○ | 雰囲気（デフォルト: `casual_daily`） | `golden_hour`, `rainy_day` |
| `tier` | ○ | 公開レベル（デフォルト: `free_sns`） | `subscriber`, `premium` |

### チラリズム / フェチカタログ

#### チラリズム系
| ID | 説明 |
|----|------|
| `zettai_ryouiki` | 絶対領域（ニーハイとスカートの間の素肌） |
| `off_shoulder` | オフショルダー（肩から滑り落ちるニット/セーター） |
| `yukata_gap` | 浴衣の襟元の隙間（うなじ見え） |
| `wind_skirt` | 風でなびくスカートの裾 |
| `back_line` | 背中の開いたドレスからの肩甲骨 |
| `sitting_cross` | 足を組んで座る（スカートの自然な上がり） |

#### フェチ系
| ID | 説明 |
|----|------|
| `wet_sheer` | 濡れ透け（雨/水しぶきで衣服が肌に張り付く） |
| `dewy_skin` | 汗ばみ（肌がしっとりと輝く、運動後/夏の暑さ） |
| `neck_sweat` | 首筋の汗（うなじに汗の雫が光る） |
| `towel_wrap` | タオル巻き（お風呂上がりのタオル姿） |
| `wet_hair` | 雨濡れ髪（突然の雨で髪が顔/首に張り付く） |
| `morning_stretch` | 朝の寝起きストレッチ（薄着＋伸び） |
| `steam_bath` | 入浴シーン（湯気越し、タオル巻き） |

### 出力フォーマット

```
=== POSITIVE PROMPT ===
[ComfyUI/SD用のポジティブプロンプト — 自然言語形式]

=== NEGATIVE PROMPT ===
[品質・アーティファクト排除 + tier制限に基づくネガティブプロンプト]

=== GENERATION SETTINGS ===
Model: [ベースモデル推奨]
Sampler: [推奨サンプラー]
Steps: [推奨ステップ数]
CFG Scale: [推奨CFG]
Resolution: [推奨解像度]
LoRA: [推奨LoRA名 + 重み]
IP-Adapter: [FaceID設定]
ControlNet: [必要に応じて]
Upscaler: [推奨アップスケーラー]
```

## プロンプト構築ロジック

### Step 1: キャラクターブロック（アンカー — 常に固定）

`resources/prompt-blocks.json` の `characters` セクションからキャラ設定を読み込み、
以下の形式で記述する。**このブロックは全画像で完全に同一にすること**：

```
A high-resolution professional photograph of a beautiful [age]-year-old [nationality] woman
with [face description], [hair description], [body description],
```

### Step 2: 衣装ブロック

`outfit` パラメータが指定されればそのまま使用。未指定ならキャラのデフォルト衣装を使う。

```
wearing [outfit description],
```

### Step 3: チラリズム/フェチ修飾子

`resources/prompt-blocks.json` の `chiralism_modifiers` または `fetish_modifiers` から
対応する記述を取得し、自然な形でプロンプトに組み込む。

```
[chiralism/fetish modifier description],
```

### Step 4: シーン記述

`scene` がテンプレートID（例: `office_01`）ならテンプレートから取得。
自由記述ならそのまま自然言語として組み込む。

```
[scene description],
```

### Step 5: テクニカルブロック（カメラ・ライティング）

`resources/prompt-blocks.json` の `camera_presets` と `mood_presets` から取得。

```
[camera/lens specification], [lighting/mood description],
```

### Step 6: 品質修飾子（固定）

```
raw photo, ultra-detailed, natural skin texture, visible pores,
sharp focus, 8k resolution, photojournalistic style
```

### Step 7: ネガティブプロンプト構築

基本ネガティブ（品質・AI感排除）は常に含める。
`tier` が `free_sns` の場合、SFW追加制限を加える。

## ファイル構成

```
generate-beauty-prompt/
├── SKILL.md                    # このファイル
├── resources/
│   ├── prompt-blocks.json      # キャラ定義・修飾子・カメラ・ムード
│   └── scene-templates.json    # 日常シーンテンプレート
└── examples/
    ├── example-zettai-ryouiki.md
    ├── example-wet-sheer.md
    └── example-yukata.md
```

## 注意事項

- 生成後は必ず `docs/characters/quality-checklist.md` に従い目視確認すること
- `tier: free_sns` のプロンプトはSNS規約に適合するよう過度な露出を避ける
- IP-Adapter FaceID のリファレンス画像はキャラごとに固定し、変更しないこと
- フェチ要素（wet_sheer等）は `tier: subscriber` 以上で使用すること
