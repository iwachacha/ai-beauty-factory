import process from 'node:process'
import {
  createRunId,
  ensureActiveSmokeAccount,
  getNpmCommand,
  getStudioSettings,
  runPostActivationNegativeChecks,
  runPreActivationNegativeChecks,
  runCommand,
  runSmokeFlow,
  startStudioStack,
  stopStudioStack,
  waitForFactoryLogin,
  webRoot,
} from './studio-test-env.mjs'

const args = new Set(process.argv.slice(2))
const mode = args.has('--mode=browser') || args.has('--browser') ? 'browser' : 'smoke'

async function runBrowserFlow(settings, runId) {
  await runCommand(getNpmCommand(), ['exec', 'playwright', 'test', '-c', 'playwright.studio.config.ts'], {
    name: 'Studio browser E2E',
    cwd: webRoot,
    env: {
      ...process.env,
      CI: '1',
      STUDIO_E2E_BASE_URL: settings.webBaseUrl,
      STUDIO_E2E_ADMIN_EMAIL: settings.adminEmail,
      STUDIO_E2E_ADMIN_PASSWORD: settings.adminPassword,
      STUDIO_E2E_RUN_ID: runId,
    },
  })
}

async function main() {
  const settings = getStudioSettings()
  const runId = createRunId(mode)
  const stack = await startStudioStack(settings)

  try {
    const session = await waitForFactoryLogin(settings)
    const preActivationSummary = await runPreActivationNegativeChecks(session, settings, { runId: `${runId}-pre` })
    for (const [key, value] of Object.entries(preActivationSummary)) {
      console.log(`${key}=${value}`)
    }

    const channelState = await ensureActiveSmokeAccount(session, settings)
    console.log(`active_account_id=${channelState.activeAccountId}`)

    if (mode === 'browser') {
      await runBrowserFlow(settings, runId)
      console.log('browser_e2e_passed=true')
    }

    const postActivationSummary = await runPostActivationNegativeChecks(session, settings, { runId: `${runId}-post` })
    for (const [key, value] of Object.entries(postActivationSummary)) {
      console.log(`${key}=${value}`)
    }

    const smokeSummary = await runSmokeFlow(session, settings, { runId: `${runId}-smoke` })
    for (const [key, value] of Object.entries(smokeSummary)) {
      console.log(`${key}=${value}`)
    }
  }
  finally {
    await stopStudioStack(stack)
  }
}

await main()
