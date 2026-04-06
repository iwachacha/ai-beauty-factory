$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

. (Join-Path $PSScriptRoot 'verify-common.ps1')

$repoRoot = Get-RepoRoot
Push-Location $repoRoot
try {
  $before = Get-TrackedStatusSnapshot

  Invoke-NativeStep -Name 'Guardrail text checks' -Action { Assert-RepoTextGuards }
  Invoke-BackendScript -Name 'Backend studio lint' -Arguments @('pnpm', 'run', 'lint:studio')
  Invoke-BackendScript -Name 'Backend tests' -Arguments @('pnpm', 'run', 'test:factory')
  Invoke-BackendScript -Name 'Backend build' -Arguments @('pnpm', 'run', 'build:factory')
  Invoke-WebScript -Name 'Web typecheck' -Arguments @('run', 'typecheck')
  Invoke-WebScript -Name 'Web tests' -Arguments @('run', 'test')
  Invoke-WebScript -Name 'Web build' -Arguments @('run', 'build')

  $after = Get-TrackedStatusSnapshot
  Assert-TrackedStatusUnchanged -Before $before -After $after -Context 'verify-fast'
  Write-Host 'verify-fast passed.'
}
finally {
  Pop-Location
}
