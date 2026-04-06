import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

interface TsConfigPaths {
  compilerOptions?: {
    paths?: Record<string, string[]>
  }
}

const configDir = dirname(fileURLToPath(import.meta.url))
const workspaceRoot = resolve(configDir, '../..')
const tsconfig = JSON.parse(
  readFileSync(resolve(workspaceRoot, 'tsconfig.base.json'), 'utf8'),
) as TsConfigPaths

const aliasEntries = Object.entries(tsconfig.compilerOptions?.paths || {})
const alias = Object.fromEntries(
  aliasEntries.map(([name, targets]) => {
    const firstTarget = targets[0]
    if (!firstTarget) {
      throw new Error(`Missing path target for alias: ${name}`)
    }

    return [
      name.replace(/\/\*$/, ''),
      resolve(workspaceRoot, firstTarget.replace(/\/\*$/, '')),
    ]
  }),
)

export default defineConfig({
  root: workspaceRoot,
  resolve: {
    alias,
  },
  test: {
    environment: 'node',
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    include: ['apps/factory-server/src/**/*.spec.ts'],
    passWithNoTests: false,
  },
})
