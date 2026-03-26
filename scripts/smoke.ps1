$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$backendRoot = Join-Path $root 'backend'
$webRoot = Join-Path $root 'web'
$nodeExe = Join-Path ${env:ProgramFiles} 'nodejs\node.exe'
$backendScript = Join-Path $backendRoot 'apps\factory-server\scripts\run-local.ps1'
$nextCli = Join-Path $webRoot 'node_modules\next\dist\bin\next'

if (-not (Test-Path $nodeExe)) {
  throw "Node executable not found: $nodeExe"
}

$env:PATH = "$(Split-Path $nodeExe);$env:PATH"

$backendListener = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq 3012 } | Select-Object -First 1
if ($backendListener) {
  Stop-Process -Id $backendListener.OwningProcess -Force
  Start-Sleep -Seconds 2
}

$webListener = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq 6070 } | Select-Object -First 1
if ($webListener) {
  Stop-Process -Id $webListener.OwningProcess -Force
  Start-Sleep -Seconds 2
}

$backendProcess = Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $backendScript) -WorkingDirectory $backendRoot -PassThru -WindowStyle Hidden
$webProcess = Start-Process -FilePath $nodeExe -ArgumentList @($nextCli, 'start', '-p', '6070') -WorkingDirectory $webRoot -PassThru -WindowStyle Hidden

try {
  $backendReady = $false
  for ($i = 0; $i -lt 45; $i++) {
    Start-Sleep -Seconds 2
    try {
      $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3012/api/jobs' -UseBasicParsing -TimeoutSec 3
      if ($r.StatusCode -eq 200 -or $r.StatusCode -eq 401) {
        $backendReady = $true
        break
      }
    }
    catch {
      if ($_.Exception.Response -and $_.Exception.Response.StatusCode.value__ -eq 401) {
        $backendReady = $true
        break
      }
    }
  }

  if (-not $backendReady) {
    throw 'Backend did not become ready on port 3012.'
  }

  $webReady = $false
  for ($i = 0; $i -lt 45; $i++) {
    Start-Sleep -Seconds 2
    try {
      $r = Invoke-WebRequest -Uri 'http://127.0.0.1:6070/accounts' -UseBasicParsing -TimeoutSec 3
      if ($r.StatusCode -eq 200) {
        $webReady = $true
        break
      }
    }
    catch {}
  }

  if (-not $webReady) {
    throw 'Web did not become ready on port 6070.'
  }

  $login = Invoke-RestMethod -Uri 'http://127.0.0.1:3012/api/auth/login' -Method Post -ContentType 'application/json' -Body (@{ email = 'admin@example.com'; password = 'changeme123' } | ConvertTo-Json)
  $token = $login.data.token
  $headers = @{ Authorization = "Bearer $token" }

  $accounts = Invoke-RestMethod -Uri 'http://127.0.0.1:3012/api/accounts' -Headers $headers -Method Get
  $assets = Invoke-RestMethod -Uri 'http://127.0.0.1:3012/api/content/assets' -Headers $headers -Method Get
  $page = Invoke-WebRequest -Uri 'http://127.0.0.1:6070/accounts' -UseBasicParsing

  Write-Host "backend_ready=$backendReady"
  Write-Host "web_ready=$webReady"
  Write-Host "token_present=$([string]::IsNullOrWhiteSpace($token) -eq $false)"
  Write-Host "accounts_count=$($accounts.data.Count)"
  Write-Host "assets_count=$($assets.data.Count)"
  Write-Host "has_mobile_nav=$($page.Content -match 'factory-bottom-nav')"
}
finally {
  Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
  Stop-Process -Id $webProcess.Id -Force -ErrorAction SilentlyContinue
}
