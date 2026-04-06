import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptsRoot = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptsRoot, '..')

function git(args) {
  return execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

function safeGit(args) {
  try {
    return git(args)
  }
  catch {
    return ''
  }
}

function getDiffRange() {
  if (!process.env.GITHUB_SHA) {
    return null
  }

  const eventName = process.env.GITHUB_EVENT_NAME || ''
  const headSha = process.env.GITHUB_SHA || 'HEAD'

  if (eventName === 'pull_request') {
    const baseRef = process.env.GITHUB_BASE_REF
    if (!baseRef) {
      throw new Error('GITHUB_BASE_REF is required for pull_request events.')
    }

    return `origin/${baseRef}...${headSha}`
  }

  const beforeSha = process.env.GITHUB_EVENT_BEFORE
  if (beforeSha && !/^0+$/.test(beforeSha)) {
    return `${beforeSha}...${headSha}`
  }

  return `${headSha}^...${headSha}`
}

const browserFlowPatterns = [
  /^web\/app\//,
  /^web\/components\//,
  /^web\/lib\//,
  /^web\/e2e\//,
  /^web\/playwright\.studio\.config\.ts$/,
  /^backend\/apps\/factory-server\/src\/studio\//,
  /^backend\/apps\/factory-server\/src\/factory\/factory-auth\./,
  /^backend\/apps\/factory-server\/src\/factory\/factory-settings\./,
  /^backend\/apps\/factory-server\/src\/factory\/factory\.module\.ts$/,
  /^scripts\/run-studio-verification\.mjs$/,
  /^scripts\/studio-test-env\.mjs$/,
  /^scripts\/smoke\.ps1$/,
  /^scripts\/comfyui\//,
]

const smokePatterns = [
  ...browserFlowPatterns,
  /^backend\/apps\/factory-server\/src\//,
  /^backend\/apps\/factory-server\/config\//,
  /^backend\/apps\/factory-server\/scripts\//,
  /^backend\/package\.json$/,
  /^backend\/pnpm-lock\.yaml$/,
  /^web\/package\.json$/,
  /^web\/package-lock\.json$/,
  /^docker-compose\.yml$/,
  /^scripts\/verify-full\.ps1$/,
  /^scripts\/start-backend\.ps1$/,
  /^scripts\/start-web\.ps1$/,
  /^\.github\/workflows\//,
  /^\.githooks\//,
]

function matchesAny(file, patterns) {
  return patterns.some(pattern => pattern.test(file))
}

function setOutput(name, value) {
  const outputPath = process.env.GITHUB_OUTPUT
  if (outputPath) {
    fs.appendFileSync(outputPath, `${name}=${value}\n`)
  }
}

function appendSummary(lines) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY
  if (summaryPath) {
    fs.appendFileSync(summaryPath, `${lines.join('\n')}\n`)
  }
}

const diffRange = getDiffRange()
const changedFiles = safeGit(diffRange ? ['diff', '--name-only', diffRange] : ['diff', '--name-only', 'HEAD', '--'])
  .split(/\r?\n/)
  .map(file => file.trim())
  .filter(Boolean)

const numstatRows = safeGit(diffRange ? ['diff', '--numstat', diffRange] : ['diff', '--numstat', 'HEAD', '--'])
  .split(/\r?\n/)
  .map(line => line.trim())
  .filter(Boolean)

let totalChangedLines = 0
for (const row of numstatRows) {
  const [added, removed] = row.split(/\s+/)
  totalChangedLines += Number.parseInt(added, 10) || 0
  totalChangedLines += Number.parseInt(removed, 10) || 0
}

const browserTouched = changedFiles.some(file => matchesAny(file, browserFlowPatterns))
const smokeTouched = changedFiles.some(file => matchesAny(file, smokePatterns))
const broadDiff = changedFiles.length >= 10 || totalChangedLines >= 350

const browserRequired = browserTouched || (broadDiff && smokeTouched)
const smokeRequired = smokeTouched || browserRequired
const tier = browserRequired ? 'browser' : smokeRequired ? 'smoke' : 'fast'

const reasons = []
if (browserTouched) {
  reasons.push('user-facing studio flow files changed')
}
if (!browserTouched && broadDiff && smokeTouched) {
  reasons.push('broad runtime diff detected')
}
if (!browserRequired && smokeTouched) {
  reasons.push('runtime, CI, or verification files changed')
}
if (!smokeRequired) {
  reasons.push('fast tier is sufficient for this diff')
}

const summaryLines = [
  '## Change Scope',
  '',
  `- Diff range: \`${diffRange || 'working tree vs HEAD'}\``,
  `- Changed files: ${changedFiles.length}`,
  `- Changed lines: ${totalChangedLines}`,
  `- Verification tier: \`${tier}\``,
  `- Browser E2E required: \`${browserRequired}\``,
  `- API smoke required: \`${smokeRequired}\``,
  `- Reason: ${reasons.join('; ')}`,
]

if (changedFiles.length > 0) {
  summaryLines.push('', '### Changed Files', '')
  for (const file of changedFiles.slice(0, 40)) {
    summaryLines.push(`- \`${file}\``)
  }
  if (changedFiles.length > 40) {
    summaryLines.push(`- ...and ${changedFiles.length - 40} more`)
  }
}

appendSummary(summaryLines)
console.log(summaryLines.join('\n'))

setOutput('tier', tier)
setOutput('smoke_required', String(smokeRequired))
setOutput('browser_e2e_required', String(browserRequired))
setOutput('changed_files_count', String(changedFiles.length))
setOutput('changed_lines_count', String(totalChangedLines))
