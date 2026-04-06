$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

. (Join-Path $PSScriptRoot 'verify-common.ps1')

$repoRoot = Get-RepoRoot
Push-Location $repoRoot
try {
  $before = @(Get-TrackedStatusSnapshot)

  Invoke-NativeStep -Name 'verify-fast' -Action { & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $repoRoot 'scripts\verify-fast.ps1') }
  Assert-DockerPrerequisites
  Invoke-NativeStep -Name 'Studio smoke test' -Action { & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $repoRoot 'scripts\smoke.ps1') }

  $after = @(Get-TrackedStatusSnapshot)
  Assert-TrackedStatusUnchanged -Before $before -After $after -Context 'verify-full'
  Write-Host 'verify-full passed.'
}
finally {
  Pop-Location
}
