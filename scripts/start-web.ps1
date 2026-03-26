$ErrorActionPreference = 'Stop'

$webRoot = Resolve-Path (Join-Path $PSScriptRoot '..\web')
$nodeExe = Join-Path ${env:ProgramFiles} 'nodejs\node.exe'
$nextCli = Join-Path $webRoot 'node_modules\next\dist\bin\next'

if (-not (Test-Path $nodeExe)) {
  throw "Node executable not found: $nodeExe"
}

if (-not (Test-Path $nextCli)) {
  throw "Next CLI not found: $nextCli. Run npm install in /web first."
}

Set-Location $webRoot
$env:PATH = "$(Split-Path $nodeExe);$env:PATH"

& $nodeExe $nextCli start -p 6070
