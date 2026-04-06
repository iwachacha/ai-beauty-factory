$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Push-Location $repoRoot
try {
  $node = Get-Command node -ErrorAction SilentlyContinue
  if (-not $node) {
    throw 'Node.js is required to run the Studio smoke verification.'
  }

  & $node.Source (Join-Path $repoRoot 'scripts\run-studio-verification.mjs') --mode=smoke
  if ($LASTEXITCODE -ne 0) {
    throw "Studio smoke verification failed with exit code $LASTEXITCODE."
  }
}
finally {
  Pop-Location
}
