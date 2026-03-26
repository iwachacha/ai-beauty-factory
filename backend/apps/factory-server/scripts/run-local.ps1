$ErrorActionPreference = 'Stop'

$workspaceRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..\..')
$nodeExe = Join-Path ${env:ProgramFiles} 'nodejs\node.exe'
$aliasHook = Join-Path $PSScriptRoot 'register-built-aliases.js'
$entryFile = Join-Path $workspaceRoot 'dist\apps\factory-server\apps\factory-server\src\main.js'

if (-not (Test-Path $nodeExe)) {
  throw "Node executable not found: $nodeExe"
}

$distMissing = @()
if (-not (Test-Path $aliasHook)) { $distMissing += $aliasHook }
if (-not (Test-Path $entryFile)) { $distMissing += $entryFile }
if ($distMissing.Count -gt 0) {
  throw "Build artifacts missing: $($distMissing -join ', ')"
}

$env:PATH = "$(Split-Path $nodeExe);$env:PATH"

Set-Location $workspaceRoot

& $nodeExe `
  -r $aliasHook `
  $entryFile `
  -c 'apps/factory-server/config/local.config.js'
