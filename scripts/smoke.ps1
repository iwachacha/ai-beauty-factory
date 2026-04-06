$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$backendRoot = Join-Path $root 'backend'
$webRoot = Join-Path $root 'web'
$nodeExe = Join-Path ${env:ProgramFiles} 'nodejs\node.exe'
$backendScript = Join-Path $backendRoot 'apps\factory-server\scripts\run-local.ps1'
$nextCli = Join-Path $webRoot 'node_modules\next\dist\bin\next'
$mockComfyScript = Join-Path $root 'scripts\comfyui\mock-server.mjs'
$dotenvPath = Join-Path $root '.env'

if (-not (Test-Path $nodeExe)) {
  throw "Node executable not found: $nodeExe"
}

$env:PATH = "$(Split-Path $nodeExe);$env:PATH"

function Stop-ListenerProcess([int]$Port) {
  $listener = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq $Port } | Select-Object -First 1
  if ($listener) {
    Stop-Process -Id $listener.OwningProcess -Force
    Start-Sleep -Seconds 2
  }
}

function Wait-HttpReady([string]$Uri, [int]$Retries = 45, [int]$DelaySeconds = 2) {
  for ($i = 0; $i -lt $Retries; $i++) {
    Start-Sleep -Seconds $DelaySeconds
    try {
      $response = Invoke-WebRequest -Uri $Uri -UseBasicParsing -TimeoutSec 3
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        return $true
      }
    }
    catch {
      if ($_.Exception.Response -and $_.Exception.Response.StatusCode.value__ -eq 401) {
        return $true
      }
    }
  }

  return $false
}

function Get-EnvOrDotenv([string]$Key, [string]$Fallback = '') {
  $envItem = Get-Item -Path "Env:$Key" -ErrorAction SilentlyContinue
  if ($envItem -and $envItem.Value) {
    return $envItem.Value
  }

  if (Test-Path $dotenvPath) {
    $line = Get-Content $dotenvPath | Where-Object { $_ -match "^$Key=" } | Select-Object -First 1
    if ($line) {
      return ($line -replace "^$Key=", '').Trim()
    }
  }

  return $Fallback
}

$adminEmail = Get-EnvOrDotenv -Key 'SMOKE_FACTORY_ADMIN_EMAIL' -Fallback 'admin@example.com'
$adminPassword = Get-EnvOrDotenv -Key 'SMOKE_FACTORY_ADMIN_PASSWORD' -Fallback 'changeme123'
$mongoUri = Get-EnvOrDotenv -Key 'SMOKE_MONGODB_URI' -Fallback 'mongodb://127.0.0.1:27017/?authSource=admin&directConnection=true'
$factoryDbName = Get-EnvOrDotenv -Key 'SMOKE_FACTORY_DB_NAME' -Fallback 'factory'
$redisHost = Get-EnvOrDotenv -Key 'SMOKE_REDIS_HOST' -Fallback '127.0.0.1'
$redisPort = Get-EnvOrDotenv -Key 'SMOKE_REDIS_PORT' -Fallback '6379'
$redisPassword = Get-EnvOrDotenv -Key 'SMOKE_REDIS_PASSWORD' -Fallback ''

function Unwrap-ApiData($Response) {
  if ($null -ne $Response -and $Response.PSObject.Properties.Name -contains 'code' -and $Response.code -eq 0 -and $Response.PSObject.Properties.Name -contains 'data') {
    return $Response.data
  }

  return $Response
}

function Wait-FactoryLogin([int]$Retries = 30, [int]$DelaySeconds = 2) {
  for ($i = 0; $i -lt $Retries; $i++) {
    Start-Sleep -Seconds $DelaySeconds
    try {
      $response = Invoke-RestMethod -Uri 'http://127.0.0.1:3012/api/auth/login' -Method Post -ContentType 'application/json' -Body (@{
        email = $adminEmail
        password = $adminPassword
      } | ConvertTo-Json)

      $login = Unwrap-ApiData $response
      if ($login.token) {
        return $login
      }
    }
    catch {}
  }

  throw 'Factory admin login did not become ready.'
}

function Seed-SmokeXAccount([string]$UserId, [string]$AccountId) {
  Push-Location $backendRoot
  try {
    @'
const { MongoClient } = require('mongodb')

const [userId, accountId, uri, dbName] = process.argv.slice(2)

async function main() {
  const client = new MongoClient(uri)
  await client.connect()
  const collection = client.db(dbName).collection('account')
  const now = new Date()

  await collection.updateOne(
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

  await client.close()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
'@ | & $nodeExe - $UserId $AccountId $mongoUri $factoryDbName
  }
  finally {
    Pop-Location
  }
}

Stop-ListenerProcess -Port 3012
Stop-ListenerProcess -Port 6070
Stop-ListenerProcess -Port 8188

$mockProcess = Start-Process -FilePath $nodeExe -ArgumentList @($mockComfyScript) -WorkingDirectory $root -PassThru -WindowStyle Hidden

$backendCommand = @"
`$env:MONGODB_URI = '$mongoUri'
`$env:REDIS_HOST = '$redisHost'
`$env:REDIS_PORT = '$redisPort'
`$env:REDIS_PASSWORD = '$redisPassword'
`$env:FACTORY_ADMIN_EMAIL = '$adminEmail'
`$env:FACTORY_ADMIN_PASSWORD = '$adminPassword'
`$env:FACTORY_ADMIN_NAME = 'Factory Admin'
`$env:COMFYUI_SERVER_ADDRESS = 'http://127.0.0.1:8188'
powershell -NoProfile -ExecutionPolicy Bypass -File "$backendScript"
"@

$backendProcess = Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoProfile', '-Command', $backendCommand) -WorkingDirectory $backendRoot -PassThru -WindowStyle Hidden
$webProcess = Start-Process -FilePath $nodeExe -ArgumentList @($nextCli, 'start', '-p', '6070') -WorkingDirectory $webRoot -PassThru -WindowStyle Hidden

try {
  $mockReady = Wait-HttpReady -Uri 'http://127.0.0.1:8188/health' -Retries 20 -DelaySeconds 1
  if (-not $mockReady) {
    throw 'Mock ComfyUI did not become ready on port 8188.'
  }

  $backendReady = Wait-HttpReady -Uri 'http://127.0.0.1:3012/api/studio/v1/characters'
  if (-not $backendReady) {
    throw 'Backend did not become ready on port 3012.'
  }

  $webReady = Wait-HttpReady -Uri 'http://127.0.0.1:6070/review'
  if (-not $webReady) {
    throw 'Web did not become ready on port 6070.'
  }

  $login = Wait-FactoryLogin
  $token = $login.token
  $userId = $login.user.id
  $headers = @{ Authorization = "Bearer $token" }

  $smokeAccountId = 'twitter_smoke_account'
  Seed-SmokeXAccount -UserId $userId -AccountId $smokeAccountId

  $channelState = Unwrap-ApiData (Invoke-RestMethod -Uri 'http://127.0.0.1:3012/api/studio/v1/channel-account' -Method Post -Headers $headers -ContentType 'application/json' -Body (@{ accountId = $smokeAccountId } | ConvertTo-Json))
  if (-not $channelState.activeAccountId) {
    throw 'Failed to activate the smoke X account.'
  }

  $character = Unwrap-ApiData (Invoke-RestMethod -Uri 'http://127.0.0.1:3012/api/studio/v1/characters' -Method Post -Headers $headers -ContentType 'application/json' -Body ((@{
    code = 'smoke-char'
    displayName = 'Smoke Character'
    personaSummary = 'A calm and polished studio persona used for smoke verification.'
    nationality = 'Japan'
    profession = 'Model'
    styleNotes = @('soft glam', 'natural light')
    defaultTier = 'free_sns'
    faceReferenceAssetIds = @('face_ref_smoke')
    status = 'active'
  } | ConvertTo-Json -Depth 6)))

  $template = Unwrap-ApiData (Invoke-RestMethod -Uri 'http://127.0.0.1:3012/api/studio/v1/templates' -Method Post -Headers $headers -ContentType 'application/json' -Body ((@{
    code = 'smoke-template'
    scene = 'window light portrait'
    intent = 'quiet confidence'
    outfitTags = @('silk robe')
    fetishTags = @('wet hair')
    tierSuitability = @('free_sns')
    positiveBlocks = @('cinematic portrait', 'high detail skin', 'soft morning light')
    negativeBlocks = @('extra fingers', 'blurry eyes')
    status = 'active'
  } | ConvertTo-Json -Depth 6)))

  $runDetail = Unwrap-ApiData (Invoke-RestMethod -Uri 'http://127.0.0.1:3012/api/studio/v1/generation-runs' -Method Post -Headers $headers -ContentType 'application/json' -Body ((@{
    characterId = $character.id
    templateId = $template.id
    targetPlatform = 'x'
    targetTier = 'free_sns'
  } | ConvertTo-Json -Depth 6)))

  $asset = $runDetail.assets | Select-Object -First 1
  if (-not $asset) {
    Write-Host "generation_run_status=$($runDetail.run.status)"
    Write-Host "generation_run_error=$($runDetail.run.error)"
    Write-Host "generation_asset_count=$($runDetail.assets.Count)"
    throw 'Smoke generation did not return any assets.'
  }

  $reviewedAsset = Unwrap-ApiData (Invoke-RestMethod -Uri "http://127.0.0.1:3012/api/studio/v1/generated-assets/$($asset.id)/review" -Method Post -Headers $headers -ContentType 'application/json' -Body ((@{
    decision = 'approve'
    reviewScore = 92
    rejectionReasons = @()
    operatorNote = 'Smoke approval'
  } | ConvertTo-Json -Depth 6)))

  $draft = Unwrap-ApiData (Invoke-RestMethod -Uri 'http://127.0.0.1:3012/api/studio/v1/content-drafts' -Method Post -Headers $headers -ContentType 'application/json' -Body ((@{
    generatedAssetId = $asset.id
    captionOptions = @('Smoke caption option 1', 'Smoke caption option 2')
    hashtags = @('#StudioSmoke', '#AIBeauty')
    cta = 'Smoke CTA'
    publishNote = 'Manual posting smoke check'
    status = 'draft'
  } | ConvertTo-Json -Depth 6)))

  $publishPackage = Unwrap-ApiData (Invoke-RestMethod -Uri 'http://127.0.0.1:3012/api/studio/v1/publish-packages' -Method Post -Headers $headers -ContentType 'application/json' -Body ((@{
    contentDraftId = $draft.id
    finalCaption = 'Smoke final caption'
    checklist = @('Confirm crop', 'Paste tracking URL')
  } | ConvertTo-Json -Depth 6)))
  if ($publishPackage.status -ne 'prepared') {
    throw 'Publish package was not prepared.'
  }

  $publishedPost = Unwrap-ApiData (Invoke-RestMethod -Uri 'http://127.0.0.1:3012/api/studio/v1/published-posts' -Method Post -Headers $headers -ContentType 'application/json' -Body ((@{
    publishPackageId = $publishPackage.id
    platformPostUrl = 'https://x.com/studio_smoke/status/1234567890123456789'
    manualMetrics = @{
      impressions = 1000
      likes = 120
      reposts = 12
      replies = 4
      bookmarks = 8
      profileVisits = 22
      linkClicks = 3
    }
    operatorMemo = 'Smoke published post'
  } | ConvertTo-Json -Depth 6)))
  if (-not $publishedPost.id) {
    throw 'Published post record was not created.'
  }

  $insights = Unwrap-ApiData (Invoke-RestMethod -Uri 'http://127.0.0.1:3012/api/studio/v1/insights' -Headers $headers -Method Get)
  if ($insights.summary.totalPosts -lt 1) {
    throw 'Insights did not record the published post.'
  }
  $reviewPage = Invoke-WebRequest -Uri 'http://127.0.0.1:6070/review' -UseBasicParsing

  Write-Host "mock_ready=$mockReady"
  Write-Host "backend_ready=$backendReady"
  Write-Host "web_ready=$webReady"
  Write-Host "token_present=$([string]::IsNullOrWhiteSpace($token) -eq $false)"
  Write-Host "active_account_id=$($channelState.activeAccountId)"
  Write-Host "character_id=$($character.id)"
  Write-Host "template_id=$($template.id)"
  Write-Host "generation_status=$($runDetail.run.status)"
  Write-Host "review_status=$($reviewedAsset.reviewStatus)"
  Write-Host "draft_status=$($draft.status)"
  Write-Host "publish_package_status=$($publishPackage.status)"
  Write-Host "published_post_id=$($publishedPost.id)"
  Write-Host "insights_total_posts=$($insights.summary.totalPosts)"
  Write-Host "review_page_has_shell=$($reviewPage.Content -match 'AI Beauty Studio')"
}
finally {
  Stop-Process -Id $mockProcess.Id -Force -ErrorAction SilentlyContinue
  Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
  Stop-Process -Id $webProcess.Id -Force -ErrorAction SilentlyContinue
}
