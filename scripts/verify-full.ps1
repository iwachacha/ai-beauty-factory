$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

. (Join-Path $PSScriptRoot 'verify-common.ps1')

$repoRoot = Get-RepoRoot
Push-Location $repoRoot
try {
  $before = @(Get-TrackedStatusSnapshot)

  $shellCommand = Get-PowerShellCommand
  Invoke-NativeStep -Name 'verify-fast' -Action { & $shellCommand -NoProfile -File (Join-Path $repoRoot 'scripts\verify-fast.ps1') }
  Assert-DockerPrerequisites
  Invoke-NativeStep -Name 'Studio smoke test' -Action { & $shellCommand -NoProfile -File (Join-Path $repoRoot 'scripts\smoke.ps1') }

  $after = @(Get-TrackedStatusSnapshot)
  Assert-TrackedStatusUnchanged -Before $before -After $after -Context 'verify-full'
  Write-Host 'verify-full passed.'
}
finally {
  Pop-Location
}
