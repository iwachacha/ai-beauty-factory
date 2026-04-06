$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = (& git rev-parse --show-toplevel).Trim()
if (-not $repoRoot) {
  throw 'Run this script inside the repository.'
}

Push-Location $repoRoot
try {
  & git config core.hooksPath .githooks
  if ($LASTEXITCODE -ne 0) {
    throw 'Failed to configure core.hooksPath.'
  }

  Write-Host 'Git hooks installed.'
  Write-Host 'pre-commit  -> scripts/verify-fast.ps1'
  Write-Host 'pre-push    -> scripts/verify-full.ps1'
}
finally {
  Pop-Location
}
