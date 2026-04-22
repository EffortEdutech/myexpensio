$ErrorActionPreference = 'Stop'

Write-Host "== refactor lock audit ==" -ForegroundColor Cyan

$scriptPath = Join-Path $PSScriptRoot 'refactor-lock-audit.mjs'
if (-not (Test-Path $scriptPath)) {
  throw "Missing script: $scriptPath"
}

node $scriptPath
