# プロンプト例: 浴衣の隙間 (Yukata Gap)

## 入力パラメータ

- **character**: `mei`
- **scene**: `season_summer_festival` (夏祭り)
- **chiralism**: `yukata_gap`
- **camera**: `full_body`
- **mood**: `summer_festival`
- **tier**: `free_sns`

## 出力

### POSITIVE PROMPT

```
A high-resolution cinematic photograph of a beautiful 22-year-old Taiwanese woman
with a round soft face and delicate features, light natural makeup with rosy cheeks,
large expressive dark eyes, long straight jet-black hair reaching mid-back
with a decorative floral hair clip, petite figure with smooth warm-toned skin
and a delicate frame,
wearing a beautiful deep indigo yukata with white and pink cherry blossom patterns
tied with a red obi sash,
traditional yukata with the collar naturally falling slightly open near the nape
showing a glimpse of the elegant neck line and upper back
traditional and graceful,
walking through Japanese summer festival stalls with a paper fan in one hand
and candied apple in the other looking at the colorful festival lights
with a curious delighted expression,
full body environmental portrait 35mm lens f/2.8 showing the complete figure
within the festival scene context natural framing,
warm paper lantern lighting at a Japanese summer festival evening twilight glow
festive atmosphere red and gold warm tones,
raw photo, ultra-detailed, natural skin texture, visible pores,
sharp focus, 8k resolution, photojournalistic style,
detailed fabric texture of the yukata, traditional Japanese festival atmosphere
```

### NEGATIVE PROMPT

```
(worst quality, low quality:1.4), (blurry, out of focus:1.2), cartoon, anime,
3d render, cgi, illustration, painting, drawing, sketch, plastic skin,
artificial skin, doll-like, mannequin, bad anatomy, deformed, mutated,
extra limbs, missing limbs, fused fingers, too many fingers, disfigured,
watermark, text, signature, logo, username, airbrushed, overly smooth skin,
uncanny valley, cross-eyed, bad proportions,
nude, naked, explicit, nsfw, pornographic, sexual content, nipple,
genitalia, underwear clearly visible, fully transparent clothing,
lingerie as main outfit
```

### GENERATION SETTINGS

```
Model: SDXL / FLUX.1 dev
Sampler: DPM++ 2M Karras
Steps: 35
CFG Scale: 7.5
Resolution: 832x1216
LoRA: asian_beauty_realistic (0.7) + yukata_traditional (0.5)
IP-Adapter: FaceID Plus V2 (weight: 0.6) — Meiリファレンス画像使用
ControlNet: なし（自然歩行ポーズはプロンプトで制御可能）
Upscaler: R-ESRGAN 4x-UltraSharp (2x)
ADetailer: confidence 0.5 — 顔部分の精緻化
```

## 補足

- 浴衣や夏祭りシーンでは衣装LoRA（yukata_traditional）を追加し、
  布地のテクスチャと柄の品質を向上させる。
- `tier: free_sns` のため完全なSFW制限を適用。
- うなじの見え方は「着崩れ」ではなく「伝統的な着付けによる自然な開き」として描写する。
