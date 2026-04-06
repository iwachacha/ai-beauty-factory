$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Get-RepoRoot {
  $root = & git rev-parse --show-toplevel
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($root)) {
    throw 'Unable to resolve repository root.'
  }

  return $root.Trim()
}

function Invoke-NativeStep {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name,
    [Parameter(Mandatory = $true)]
    [scriptblock]$Action
  )

  Write-Host "==> $Name"
  $global:LASTEXITCODE = 0
  & $Action
  if ($LASTEXITCODE -ne 0) {
    throw "$Name failed with exit code $LASTEXITCODE."
  }
}

function Get-TrackedStatusSnapshot {
  $status = & git status --porcelain=v1 --untracked-files=no
  if ($LASTEXITCODE -ne 0) {
    throw 'Unable to read tracked git status.'
  }

  return @($status)
}

function Assert-TrackedStatusUnchanged {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Before,
    [Parameter(Mandatory = $true)]
    [string[]]$After,
    [Parameter(Mandatory = $true)]
    [string]$Context
  )

  $beforeText = ($Before -join "`n").Trim()
  $afterText = ($After -join "`n").Trim()

  if ($beforeText -ne $afterText) {
    Write-Host 'Tracked file status before verification:'
    if ([string]::IsNullOrWhiteSpace($beforeText)) {
      Write-Host '<clean>'
    }
    else {
      Write-Host $beforeText
    }
    Write-Host 'Tracked file status after verification:'
    if ([string]::IsNullOrWhiteSpace($afterText)) {
      Write-Host '<clean>'
    }
    else {
      Write-Host $afterText
    }
    throw "$Context modified tracked files. Verification commands must be non-destructive."
  }
}

function Get-GuardrailSearchPaths {
  $candidates = @(
    'README.md',
    'AGENTS.md',
    'backend/apps/factory-server',
    'web',
    'scripts',
    '.github',
    '.agents'
  )

  $root = Get-RepoRoot
  return @(
    foreach ($candidate in $candidates) {
      if (Test-Path (Join-Path $root $candidate)) {
        $candidate
      }
    }
  )
}

function Assert-GitGrepHasNoMatches {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Pattern,
    [Parameter(Mandatory = $true)]
    [string]$Description,
    [string[]]$ExcludePaths = @()
  )

  $paths = Get-GuardrailSearchPaths
  if ($paths.Count -eq 0) {
    return
  }

  $pathSpecs = $paths + @(
    foreach ($excludePath in $ExcludePaths) {
      ":(exclude)$excludePath"
    }
  )
  $gitArgs = @('grep', '-n', '-I', '-E', $Pattern, '--') + $pathSpecs
  $result = & git @gitArgs 2>&1
  $exitCode = $LASTEXITCODE

  if ($exitCode -eq 0) {
    Write-Host $result
    throw "$Description detected in guarded repo paths."
  }

  if ($exitCode -gt 1) {
    Write-Host $result
    throw "git grep failed while checking $Description."
  }

  $global:LASTEXITCODE = 0
}

function Assert-RepoTextGuards {
  Assert-GitGrepHasNoMatches -Pattern '^(<<<<<<<|=======|>>>>>>>)' -Description 'merge conflict markers'
  Assert-GitGrepHasNoMatches -Pattern 'TODO:|FIXME:|XXX:|WIP:|NOT_IMPLEMENTED|IMPLEMENT_ME' -Description 'placeholder markers' -ExcludePaths @('scripts/verify-common.ps1')
  Assert-GitGrepHasNoMatches -Pattern '@ts-ignore|ts-expect-error' -Description 'TypeScript ignore directives' -ExcludePaths @('AGENTS.md', 'scripts/verify-common.ps1')
}

function Invoke-BackendScript {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name,
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments
  )

  $root = Get-RepoRoot
  Push-Location (Join-Path $root 'backend')
  try {
    Invoke-NativeStep -Name $Name -Action { & corepack @Arguments }
  }
  finally {
    Pop-Location
  }
}

function Invoke-WebScript {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name,
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments
  )

  $root = Get-RepoRoot
  Push-Location (Join-Path $root 'web')
  try {
    Invoke-NativeStep -Name $Name -Action { & npm @Arguments }
  }
  finally {
    Pop-Location
  }
}

function Assert-DockerPrerequisites {
  $docker = Get-Command docker -ErrorAction SilentlyContinue
  if (-not $docker) {
    throw 'verify-full requires Docker Desktop. Install Docker and start the daemon first.'
  }

  $services = & docker compose ps --services --status running 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Host $services
    throw 'verify-full requires `docker compose up -d` to be available and working from the repo root.'
  }

  $running = @($services | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
  $required = @('mongo', 'valkey')
  $missing = @(
    foreach ($service in $required) {
      if ($service -notin $running) {
        $service
      }
    }
  )

  if ($missing.Count -gt 0) {
    throw "verify-full requires running infrastructure services: $($missing -join ', '). Start them with `docker compose up -d`."
  }
}
