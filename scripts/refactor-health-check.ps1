$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

function Run-Step {
  param(
    [string]$Title,
    [string]$Command
  )

  Write-Host ''
  Write-Host ("== {0} ==" -f $Title) -ForegroundColor Cyan
  Write-Host $Command
  Invoke-Expression $Command
}

Run-Step -Title 'clean build caches' -Command 'powershell -ExecutionPolicy Bypass -File .\scripts\clean-build-caches.ps1'
Run-Step -Title 'validate' -Command 'pnpm validate'
Run-Step -Title 'refactor lock audit' -Command 'powershell -ExecutionPolicy Bypass -File .\scripts\refactor-lock-audit.ps1'
Run-Step -Title 'db runtime audit' -Command 'powershell -ExecutionPolicy Bypass -File .\scripts\db-runtime-audit.ps1 -FailOnHits'
Run-Step -Title 'type sync residue audit' -Command 'powershell -ExecutionPolicy Bypass -File .\scripts\type-sync-schema-residue-audit.ps1 -FailOnHits'

Write-Host ''
Write-Host 'Refactor health check passed.' -ForegroundColor Green
