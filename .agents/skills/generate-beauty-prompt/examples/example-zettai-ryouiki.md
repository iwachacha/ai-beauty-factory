# プロンプト例: 絶対領域 (Zettai Ryouiki)

## 入力パラメータ

- **character**: `yuna`
- **scene**: `office_01` (オフィスで書類を拾う)
- **chiralism**: `zettai_ryouiki`
- **camera**: `low_angle`
- **mood**: `casual_daily`
- **tier**: `free_sns`

## 出力

### POSITIVE PROMPT

```
A high-resolution professional photograph of a beautiful 24-year-old Japanese woman
with an oval face and soft gentle features, natural light makeup, warm brown eyes,
slight dimples when smiling, long black hair with subtle chestnut highlights
slightly wavy worn in a loose ponytail, slender figure with fair porcelain skin,
wearing a fitted grey pencil skirt above the knee and white silk blouse
with black thigh-high stockings,
thigh-high stockings with a clearly visible gap of bare skin between
the stocking top and the skirt hem the absolute territory zone highlighted
by natural lighting,
picking up dropped documents from the floor in a modern open-plan office
bending forward naturally with one hand on knee,
shot from slightly below eye level looking up 35mm wide-angle lens
natural perspective distortion emphasizing legs and figure,
soft natural daylight streaming through a window warm indoor atmosphere
cozy lived-in environment natural color temperature,
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
nude, naked, explicit, nsfw, pornographic, sexual content, nipple,
genitalia, underwear clearly visible, fully transparent clothing,
lingerie as main outfit
```

### GENERATION SETTINGS

```
Model: SDXL / FLUX.1 dev
Sampler: DPM++ 2M Karras
Steps: 30
CFG Scale: 7.0
Resolution: 832x1216
LoRA: asian_beauty_realistic (0.7)
IP-Adapter: FaceID Plus V2 (weight: 0.6) — Yunaリファレンス画像使用
ControlNet: OpenPose (weight: 0.8) — 「前屈み拾い上げ」ポーズ参照
Upscaler: R-ESRGAN 4x-UltraSharp (2x)
ADetailer: confidence 0.5 — 顔部分の精緻化
```
