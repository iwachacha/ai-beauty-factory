# プロンプト例: 濡れ透け (Wet Sheer)

## 入力パラメータ

- **character**: `soojin`
- **scene**: `commute_04` (突然の夏の雨)
- **chiralism**: *(なし — フェチ主体)*
- **fetish**: `wet_sheer`, `wet_hair`
- **camera**: `full_body`
- **mood**: `rainy_day`
- **tier**: `subscriber`

## 出力

### POSITIVE PROMPT

```
A high-resolution professional photograph of a beautiful 23-year-old Korean woman
with a heart-shaped face and sharp defined jawline, minimal dewy makeup,
elegant monolid eyes with subtle eyeliner, straight dark brown hair
shoulder length center part silky smooth texture, slim toned figure
with porcelain white skin and long legs,
wearing a pleated mini skirt and light cotton white blouse,
clothing slightly dampened by rain water splash fabric clinging to skin
and becoming subtly translucent water droplets visible on skin and fabric surface
glistening wet texture,
hair dampened by sudden rain wet strands clinging to face and neck
water droplets on skin natural and candid rain-caught moment,
caught in a sudden summer rain without umbrella on a quiet residential street
clothes getting damp running toward shelter with a surprised laugh,
full body environmental portrait 35mm lens f/2.8 showing the complete figure
within the scene context natural framing,
overcast diffused light through rain-spotted environment moody cool tones
wet reflective surfaces atmospheric rain falling melancholic beauty,
raw photo, ultra-detailed, natural skin texture, visible pores,
sharp focus, 8k resolution, photojournalistic style
```

### NEGATIVE PROMPT

```
(worst quality, low quality:1.4), (blurry, out of focus:1.2), cartoon, anime,
3d render, cgi, illustration, painting, drawing, sketch, plastic skin,
artificial skin, doll-like, mannequin, bad anatomy, deformed, mutated,
extra limbs, missing limbs, fused fingers, too many fingers, disfigured,
watermark, text, signature, logo, username, airbrushed, overly smooth skin,
uncanny valley, cross-eyed, bad proportions,
fully nude, explicit sexual pose, pornographic, genitalia visible,
nipple fully exposed
```

### GENERATION SETTINGS

```
Model: SDXL / FLUX.1 dev
Sampler: DPM++ 2M Karras
Steps: 35
CFG Scale: 7.5
Resolution: 832x1216
LoRA: asian_beauty_realistic (0.7)
IP-Adapter: FaceID Plus V2 (weight: 0.6) — Soojinリファレンス画像使用
ControlNet: OpenPose (weight: 0.8) — 「走る・身をかがめる」ポーズ参照
Upscaler: R-ESRGAN 4x-UltraSharp (2x)
ADetailer: confidence 0.5 — 顔部分の精緻化
```

## 補足

- `tier: subscriber` のため、SFW完全制限（`negative_sfw_addition`）ではなく
  `negative_fetish_limits`（部分制限）を適用している。
- 濡れ透けは「衣服の質感変化」として描写し、直接的な露出は避ける。
- 雨のシーンではライティングを `rainy_day` に固定して雰囲気を統一する。
