param(
  [switch]$WhatIfOnly
)

$ErrorActionPreference = 'Stop'

function Get-RepoRoot {
  if ($PSScriptRoot) {
    return (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
  }
  return (Get-Location).Path
}

$repoRoot = Get-RepoRoot
$archiveRoot = Join-Path $repoRoot 'scripts\archive\2026-04-refactor-audit-fixes'
New-Item -ItemType Directory -Force -Path $archiveRoot | Out-Null

$targets = @(
  'install-db-runtime-audit-fix.ps1',
  'install-type-sync-schema-residue-audit-fix.ps1',
  'install-type-sync-schema-residue-audit-fix-v2.ps1',
  'install-type-sync-schema-residue-audit-fix-v3.ps1',
  'type-sync-schema-residue-audit-fixed.ps1',
  'type-sync-schema-residue-audit-fixed-v2.ps1',
  'type-sync-schema-residue-audit-fixed-v3.ps1',
  'scripts\db-runtime-audit-fixed.ps1',
  'scripts\x type-sync-schema-residue-audit.ps1'
)

$moved = @()
$skipped = @()

foreach ($relativePath in $targets) {
  $sourcePath = Join-Path $repoRoot $relativePath
  if (-not (Test-Path $sourcePath)) {
    $skipped += $relativePath
    continue
  }

  $destinationPath = Join-Path $archiveRoot $relativePath
  $destinationDir = Split-Path -Parent $destinationPath
  New-Item -ItemType Directory -Force -Path $destinationDir | Out-Null

  if ($WhatIfOnly) {
    Write-Host ("[whatif] move {0} -> {1}" -f $sourcePath, $destinationPath)
  } else {
    Move-Item -Path $sourcePath -Destination $destinationPath -Force
  }

  $moved += [pscustomobject]@{
    source = $relativePath
    destination = $destinationPath.Substring($repoRoot.Length).TrimStart('\', '/')
  }
}

Write-Host '== archive audit tooling ==' -ForegroundColor Cyan
if ($moved.Count -eq 0) {
  Write-Host 'No matching one-off audit fix files found.'
} else {
  Write-Host 'Moved files:'
  foreach ($item in $moved) {
    Write-Host ("- {0} -> {1}" -f $item.source, $item.destination)
  }
}

if ($skipped.Count -gt 0) {
  Write-Host ''
  Write-Host 'Skipped (not found):'
  foreach ($item in $skipped) {
    Write-Host ("- {0}" -f $item)
  }
}

Write-Host ''
Write-Host 'Recommended follow-up:'
Write-Host '1. pnpm validate'
Write-Host '2. powershell -ExecutionPolicy Bypass -File .\scripts\db-runtime-audit.ps1 -FailOnHits'
Write-Host '3. powershell -ExecutionPolicy Bypass -File .\scripts\type-sync-schema-residue-audit.ps1 -FailOnHits'
