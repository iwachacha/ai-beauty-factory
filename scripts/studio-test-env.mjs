import { spawn } from 'node:child_process'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import process from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

const scriptsRoot = path.dirname(fileURLToPath(import.meta.url))
export const repoRoot = path.resolve(scriptsRoot, '..')
export const backendRoot = path.join(repoRoot, 'backend')
export const webRoot = path.join(repoRoot, 'web')

const requireFromBackend = createRequire(path.join(backendRoot, 'package.json'))
const { MongoClient } = requireFromBackend('mongodb')

export function createRunId(prefix = 'studio') {
  return `${prefix}-${Date.now().toString(36)}`
}

export function getStudioSettings() {
  return {
    adminEmail: process.env.STUDIO_TEST_ADMIN_EMAIL || process.env.SMOKE_FACTORY_ADMIN_EMAIL || process.env.FACTORY_ADMIN_EMAIL || 'admin@example.com',
    adminPassword: process.env.STUDIO_TEST_ADMIN_PASSWORD || process.env.SMOKE_FACTORY_ADMIN_PASSWORD || process.env.FACTORY_ADMIN_PASSWORD || 'changeme123',
    mongoUri: process.env.STUDIO_TEST_MONGODB_URI || process.env.SMOKE_MONGODB_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/?authSource=admin&directConnection=true',
    factoryDbName: process.env.STUDIO_TEST_FACTORY_DB_NAME || process.env.SMOKE_FACTORY_DB_NAME || process.env.FACTORY_DB_NAME || 'factory',
    redisHost: process.env.STUDIO_TEST_REDIS_HOST || process.env.SMOKE_REDIS_HOST || process.env.REDIS_HOST || '127.0.0.1',
    redisPort: process.env.STUDIO_TEST_REDIS_PORT || process.env.SMOKE_REDIS_PORT || process.env.REDIS_PORT || '6379',
    redisPassword: process.env.STUDIO_TEST_REDIS_PASSWORD || process.env.SMOKE_REDIS_PASSWORD || process.env.REDIS_PASSWORD || '',
    apiBaseUrl: process.env.STUDIO_TEST_API_BASE_URL || 'http://127.0.0.1:3012/api',
    webBaseUrl: process.env.STUDIO_TEST_WEB_BASE_URL || 'http://127.0.0.1:6070',
    mockBaseUrl: process.env.STUDIO_TEST_MOCK_BASE_URL || 'http://127.0.0.1:8188',
  }
}

export function ensureFileExists(filePath, description) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${description} not found: ${filePath}`)
  }
}

function prefixOutput(stream, label) {
  if (!stream) {
    return
  }

  let remainder = ''
  stream.setEncoding('utf8')
  stream.on('data', (chunk) => {
    const parts = `${remainder}${chunk}`.split(/\r?\n/)
    remainder = parts.pop() || ''
    for (const part of parts) {
      if (part.length > 0) {
        process.stdout.write(`[${label}] ${part}\n`)
      }
    }
  })
  stream.on('end', () => {
    if (remainder.length > 0) {
      process.stdout.write(`[${label}] ${remainder}\n`)
    }
  })
}

export function spawnManagedProcess(name, command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: options.cwd,
    env: options.env,
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  prefixOutput(child.stdout, name)
  prefixOutput(child.stderr, `${name}:err`)
  child.on('exit', (code, signal) => {
    process.stdout.write(`[${name}] exited with code=${code ?? 'null'} signal=${signal ?? 'null'}\n`)
  })

  return child
}

export async function runCommand(command, args, options = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      shell: false,
      stdio: 'inherit',
    })

    child.on('error', reject)
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`${options.name || command} failed with code=${code ?? 'null'} signal=${signal ?? 'null'}`))
    })
  })
}

export async function waitForHttpReady(url, { retries = 60, delayMs = 1000, acceptedStatuses = [200, 401, 404] } = {}) {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    await delay(delayMs)
    try {
      const response = await fetch(url, { redirect: 'manual' })
      if (acceptedStatuses.includes(response.status)) {
        return true
      }
    }
    catch {
      // keep polling
    }
  }

  return false
}

export async function stopManagedProcess(child, label) {
  if (!child || child.killed || child.exitCode !== null) {
    return
  }

  child.kill('SIGTERM')
  const exited = await Promise.race([
    new Promise(resolve => child.once('exit', () => resolve(true))),
    delay(5000).then(() => false),
  ])

  if (exited) {
    return
  }

  process.stdout.write(`[${label}] forcing shutdown\n`)
  child.kill('SIGKILL')
  await Promise.race([
    new Promise(resolve => child.once('exit', () => resolve(true))),
    delay(3000),
  ])
}

export async function startStudioStack(settings = getStudioSettings()) {
  const backendEntry = path.join(backendRoot, 'dist', 'apps', 'factory-server', 'apps', 'factory-server', 'src', 'main.js')
  const aliasHook = path.join(backendRoot, 'apps', 'factory-server', 'scripts', 'register-built-aliases.js')
  const mockScript = path.join(repoRoot, 'scripts', 'comfyui', 'mock-server.mjs')
  const nextCli = path.join(webRoot, 'node_modules', 'next', 'dist', 'bin', 'next')

  ensureFileExists(backendEntry, 'Built backend entry file')
  ensureFileExists(aliasHook, 'Backend alias hook')
  ensureFileExists(mockScript, 'Mock ComfyUI server')
  ensureFileExists(nextCli, 'Next.js CLI')

  const backendEnv = {
    ...process.env,
    MONGODB_URI: settings.mongoUri,
    REDIS_HOST: settings.redisHost,
    REDIS_PORT: settings.redisPort,
    REDIS_PASSWORD: settings.redisPassword,
    FACTORY_ADMIN_EMAIL: settings.adminEmail,
    FACTORY_ADMIN_PASSWORD: settings.adminPassword,
    FACTORY_ADMIN_NAME: process.env.FACTORY_ADMIN_NAME || 'Factory Admin',
    COMFYUI_SERVER_ADDRESS: settings.mockBaseUrl,
    FACTORY_CORS_ORIGIN: settings.webBaseUrl,
  }

  const mockProcess = spawnManagedProcess('mock-comfyui', process.execPath, [mockScript], {
    cwd: repoRoot,
    env: process.env,
  })
  const backendProcess = spawnManagedProcess('factory-backend', process.execPath, [
    '-r',
    aliasHook,
    backendEntry,
    '-c',
    'apps/factory-server/config/local.config.js',
  ], {
    cwd: backendRoot,
    env: backendEnv,
  })
  const webProcess = spawnManagedProcess('studio-web', process.execPath, [nextCli, 'start', '-p', '6070'], {
    cwd: webRoot,
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: '1',
    },
  })

  try {
    const mockReady = await waitForHttpReady(`${settings.mockBaseUrl}/health`, { retries: 30, delayMs: 1000, acceptedStatuses: [200] })
    if (!mockReady) {
      throw new Error('Mock ComfyUI did not become ready on port 8188.')
    }

    const backendReady = await waitForHttpReady(`${settings.apiBaseUrl}/studio/v1/characters`, { retries: 45, delayMs: 1000, acceptedStatuses: [200, 401] })
    if (!backendReady) {
      throw new Error('Backend did not become ready on port 3012.')
    }

    const webReady = await waitForHttpReady(`${settings.webBaseUrl}/review`, { retries: 45, delayMs: 1000, acceptedStatuses: [200] })
    if (!webReady) {
      throw new Error('Web did not become ready on port 6070.')
    }

    return {
      mockProcess,
      backendProcess,
      webProcess,
      settings,
    }
  }
  catch (error) {
    await stopStudioStack({ mockProcess, backendProcess, webProcess })
    throw error
  }
}

export async function stopStudioStack(stack) {
  await stopManagedProcess(stack.webProcess, 'studio-web')
  await stopManagedProcess(stack.backendProcess, 'factory-backend')
  await stopManagedProcess(stack.mockProcess, 'mock-comfyui')
}

export function unwrapApiData(payload) {
  if (
    payload
    && typeof payload === 'object'
    && 'code' in payload
    && payload.code === 0
    && 'data' in payload
  ) {
    return payload.data
  }

  return payload
}

export async function fetchJson(url, { method = 'GET', body, headers = {} } = {}) {
  const response = await fetch(url, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`${method} ${url} failed: ${response.status} ${text}`)
  }

  return unwrapApiData(await response.json())
}

export async function fetchStudioJson(settings, pathName, { method = 'GET', body, token } = {}) {
  return await fetchJson(`${settings.apiBaseUrl}${pathName}`, {
    method,
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

export async function waitForFactoryLogin(settings, { retries = 30, delayMs = 1000 } = {}) {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    await delay(delayMs)
    try {
      const login = await fetchStudioJson(settings, '/auth/login', {
        method: 'POST',
        body: {
          email: settings.adminEmail,
          password: settings.adminPassword,
        },
      })

      if (login.token) {
        return login
      }
    }
    catch {
      // keep polling
    }
  }

  throw new Error('Factory admin login did not become ready.')
}

export async function seedSmokeXAccount({ userId, accountId, settings }) {
  const client = new MongoClient(settings.mongoUri)
  const now = new Date()

  await client.connect()
  try {
    await client.db(settings.factoryDbName).collection('account').updateOne(
      { _id: accountId },
      {
        $set: {
          userId,
          type: 'twitter',
          uid: `smoke-${userId}`,
          account: '@studio_smoke',
          loginTime: now,
          avatar: '',
          nickname: 'Studio Smoke X',
          clientType: 'web',
          loginCookie: '',
          access_token: 'smoke-token',
          refresh_token: 'smoke-refresh',
          token: '',
          fansCount: 1200,
          readCount: 0,
          likeCount: 0,
          collectCount: 0,
          forwardCount: 0,
          commentCount: 0,
          lastStatsTime: now,
          workCount: 0,
          income: 0,
          groupId: 'factory-default',
          status: 1,
          channelId: '',
          rank: 1,
          relayAccountRef: null,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true },
    )
  }
  finally {
    await client.close()
  }
}

export async function ensureActiveSmokeAccount(session, settings, accountId = 'twitter_smoke_account') {
  await seedSmokeXAccount({
    userId: session.user.id,
    accountId,
    settings,
  })

  const channelState = await fetchStudioJson(settings, '/studio/v1/channel-account', {
    method: 'POST',
    token: session.token,
    body: { accountId },
  })

  if (!channelState.activeAccountId) {
    throw new Error('Failed to activate the smoke X account.')
  }

  return channelState
}

export async function runSmokeFlow(session, settings, { runId = createRunId('smoke') } = {}) {
  const baselineInsights = await fetchStudioJson(settings, '/studio/v1/insights', {
    token: session.token,
  })
  const baselineTotalPosts = baselineInsights.summary.totalPosts

  const character = await fetchStudioJson(settings, '/studio/v1/characters', {
    method: 'POST',
    token: session.token,
    body: {
      code: `${runId}-char`,
      displayName: `Smoke Character ${runId}`,
      personaSummary: 'A calm and polished studio persona used for smoke verification.',
      nationality: 'Japan',
      profession: 'Model',
      styleNotes: ['soft glam', 'natural light'],
      defaultTier: 'free_sns',
      faceReferenceAssetIds: ['face_ref_smoke'],
      status: 'active',
    },
  })

  const template = await fetchStudioJson(settings, '/studio/v1/templates', {
    method: 'POST',
    token: session.token,
    body: {
      code: `${runId}-template`,
      scene: `window light portrait ${runId}`,
      intent: `quiet confidence ${runId}`,
      outfitTags: ['silk robe'],
      fetishTags: ['wet hair'],
      tierSuitability: ['free_sns'],
      positiveBlocks: ['cinematic portrait', 'high detail skin', 'soft morning light'],
      negativeBlocks: ['extra fingers', 'blurry eyes'],
      status: 'active',
    },
  })

  const runDetail = await fetchStudioJson(settings, '/studio/v1/generation-runs', {
    method: 'POST',
    token: session.token,
    body: {
      characterId: character.id,
      templateId: template.id,
      targetPlatform: 'x',
      targetTier: 'free_sns',
    },
  })

  const asset = runDetail.assets.at(0)
  if (!asset) {
    throw new Error(`Smoke generation did not return any assets. status=${runDetail.run.status} error=${runDetail.run.error || 'none'}`)
  }

  const reviewedAsset = await fetchStudioJson(settings, `/studio/v1/generated-assets/${asset.id}/review`, {
    method: 'POST',
    token: session.token,
    body: {
      decision: 'approve',
      reviewScore: 92,
      rejectionReasons: [],
      operatorNote: 'Smoke approval',
    },
  })

  const draft = await fetchStudioJson(settings, '/studio/v1/content-drafts', {
    method: 'POST',
    token: session.token,
    body: {
      generatedAssetId: asset.id,
      captionOptions: ['Smoke caption option 1', 'Smoke caption option 2'],
      hashtags: ['#StudioSmoke', '#AIBeauty'],
      cta: 'Smoke CTA',
      publishNote: 'Manual posting smoke check',
      status: 'draft',
    },
  })

  const publishPackage = await fetchStudioJson(settings, '/studio/v1/publish-packages', {
    method: 'POST',
    token: session.token,
    body: {
      contentDraftId: draft.id,
      finalCaption: 'Smoke final caption',
      checklist: ['Confirm crop', 'Paste tracking URL'],
    },
  })

  if (publishPackage.status !== 'prepared') {
    throw new Error('Publish package was not prepared.')
  }

  const publishedPost = await fetchStudioJson(settings, '/studio/v1/published-posts', {
    method: 'POST',
    token: session.token,
    body: {
      publishPackageId: publishPackage.id,
      platformPostUrl: `https://x.com/studio_smoke/status/${Date.now()}`,
      manualMetrics: {
        impressions: 1000,
        likes: 120,
        reposts: 12,
        replies: 4,
        bookmarks: 8,
        profileVisits: 22,
        linkClicks: 3,
      },
      operatorMemo: 'Smoke published post',
    },
  })

  if (!publishedPost.id) {
    throw new Error('Published post record was not created.')
  }

  const insights = await fetchStudioJson(settings, '/studio/v1/insights', {
    token: session.token,
  })
  if (insights.summary.totalPosts < baselineTotalPosts + 1) {
    throw new Error('Insights did not record the new published post.')
  }

  const reviewPageResponse = await fetch(`${settings.webBaseUrl}/review`)
  const reviewPageContent = await reviewPageResponse.text()
  const reviewPageHasShell = reviewPageContent.includes('AI Beauty Studio')
  if (!reviewPageHasShell) {
    throw new Error('Review page shell did not load correctly.')
  }

  return {
    activeAccountId: 'twitter_smoke_account',
    characterId: character.id,
    templateId: template.id,
    generationStatus: runDetail.run.status,
    reviewStatus: reviewedAsset.reviewStatus,
    draftStatus: draft.status,
    publishPackageStatus: publishPackage.status,
    publishedPostId: publishedPost.id,
    totalPosts: insights.summary.totalPosts,
    reviewPageHasShell,
  }
}

export function getNpmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm'
}
