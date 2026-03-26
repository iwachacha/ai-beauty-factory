$ErrorActionPreference = 'Stop'

$workspaceRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..\..')
$nodeExe = Join-Path ${env:ProgramFiles} 'nodejs\node.exe'
$tscCli = Join-Path $workspaceRoot 'node_modules\typescript\bin\tsc'
$distRoot = Join-Path $workspaceRoot 'dist\apps\factory-server'

if (-not (Test-Path $nodeExe)) {
  throw "Node executable not found: $nodeExe"
}

if (-not (Test-Path $tscCli)) {
  throw "TypeScript CLI not found: $tscCli"
}

Set-Location $workspaceRoot
$env:PATH = "$(Split-Path $nodeExe);$env:PATH"

if (Test-Path $distRoot) {
  Remove-Item -LiteralPath $distRoot -Recurse -Force
}

& $nodeExe `
  --max-old-space-size=4096 `
  $tscCli `
  -p 'apps/factory-server/tsconfig.app.json' `
  --outDir 'dist/apps/factory-server'

if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Copy-Item -LiteralPath 'apps/factory-server/README.md' -Destination (Join-Path $distRoot 'README.md') -Force
Copy-Item -LiteralPath 'apps/factory-server/package.json' -Destination (Join-Path $distRoot 'package.json') -Force
