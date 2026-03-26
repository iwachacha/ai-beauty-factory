$ErrorActionPreference = 'Stop'

$backendRoot = Join-Path $PSScriptRoot '..\backend'
Set-Location $backendRoot

powershell -NoProfile -ExecutionPolicy Bypass -File .\apps\factory-server\scripts\run-local.ps1
