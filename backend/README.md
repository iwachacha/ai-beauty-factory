# SNS Factory Backend

個人用 SNS 運用工場の backend workspace です。

主要 app:

- `apps/factory-server`

補助 source:

- `apps/aitoearn-server`
  - `factory-server` が再利用している既存 platform adapter / publishing provider を保持しています。

基本コマンド:

```powershell
corepack pnpm install
corepack pnpm run lint:factory
corepack pnpm run build:factory
corepack pnpm run serve:factory
```
