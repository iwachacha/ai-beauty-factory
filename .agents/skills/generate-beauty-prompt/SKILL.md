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

### チラリズム / フェチカタログ（全34種）

#### チラリズム系（18種）
| ID | 説明 | 推奨ティア |
|----|------|-----------|
| `zettai_ryouiki` | 絶対領域（ニーハイとスカートの間の素肌） | free_sns |
| `off_shoulder` | オフショルダー（肩から滑り落ちるニット/セーター） | free_sns |
| `yukata_gap` | 浴衣の襟元の隙間（うなじ見え） | free_sns |
| `wind_skirt` | 風でなびくスカートの裾 | free_sns |
| `back_line` | 背中の開いたドレスからの肩甲骨 | free_sns |
| `sitting_cross` | 足を組んで座る（スカートの自然な上がり） | free_sns |
| `thigh_squish` | 太ももの肉感（座った時の圧縮） | free_sns |
| `shoulder_slip` | 肩紐ずり落ち（キャミ・ブラ紐が滑る） | subscriber |
| `hair_tie` | 髪を結ぶ仕草（うなじ・脇が見える＋ヘアゴム口咥え） | free_sns |
| `cleavage_top` | 俯瞰からの谷間（ボタンシャツの隙間） | subscriber |
| `panty_flash` | パンちら（風や動きでの偶発的な下着露出） | subscriber |
| `leaning_cleavage` | 前かがみ胸ちら（テーブルに寄りかかる無防備な露出） | subscriber |
| `bra_sheer` | ブラ透け（薄い白シャツ越しの下着の輪郭） | free_sns |
| `vpl` | パンティーライン（タイトなボトムスに浮く下着ライン） | subscriber |
| `button_gap` | ボタンの隙間（横から見た胸元の開き） | subscriber |
| `relaxed_leg_gap` | あぐら・体操座りの隙間（太もも奥の暗がり） | premium |
| `bending_over_back` | 床の物を拾う後ろ姿（ヒップラインの強調） | subscriber |
| `mid_undress` | 着替えの途中（服が頭にかかり腹部が露出） | premium |

#### フェチ系（16種）
| ID | 説明 | 推奨ティア |
|----|------|-----------|
| `wet_sheer` | 濡れ透け（雨/水しぶきで衣服が肌に張り付く） | subscriber |
| `dewy_skin` | 汗ばみ（肌がしっとりと輝く、運動・夏の暑さ） | free_sns |
| `neck_sweat` | 首筋の汗（うなじに汗の雫が光る） | free_sns |
| `towel_wrap` | タオル巻き（お風呂上がりのタオル姿） | premium |
| `wet_hair` | 雨濡れ髪（突然の雨で髪が顔/首に張り付く） | subscriber |
| `morning_stretch` | 朝の寝起きストレッチ（薄着＋伸び） | subscriber |
| `steam_bath` | 入浴シーン（湯気越し、タオル巻き） | premium |
| `armpits` | 脇見せ（ノースリーブや腕上げの自然な脇露出） | subscriber |
| `collarbone` | 鎖骨（広い襟ぐりで骨格と影を強調） | free_sns |
| `see_through` | シースルー・レース素材（透け感のある布地） | subscriber |
| `glasses_slip` | ずれた眼鏡（鼻先まで下がった知的な色気） | free_sns |
| `pantyhose_feet` | OLスーツ・パンスト足（ナイロン質感の強調） | free_sns |
| `rib_knit_bust` | ピタニット（リブニットがバストラインを強調） | free_sns |
| `adjusting_strap` | 下着の紐を直す（プライベートな仕草） | subscriber |
| `hands_between_thighs` | 太ももに挟んだ手（柔らかさと体温の表現） | subscriber |
| `touching_lips` | 唇についた髪・指で拭う（唇と指先の色気） | free_sns |

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
│   ├── prompt-blocks.json      # キャラ定義・修飾子・カメラ・ムード (34種)
│   └── scene-templates.json    # 日常シーンテンプレート (30+)
└── examples/
    ├── example-zettai-ryouiki.md
    ├── example-wet-sheer.md
    └── example-yukata.md
```

## 注意事項

- 生成後は walkthrough.md の品質評価セクションに従い目視確認すること
- `tier: free_sns` のプロンプトはSNS規約に適合するよう過度な露出を避ける
- IP-Adapter FaceID のリファレンス画像はキャラごとに固定し、変更しないこと
- 各要素の推奨ティアを遵守すること（カタログの「推奨ティア」列を参照）
