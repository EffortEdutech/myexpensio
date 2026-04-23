$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

Write-Host '== finalize db object audit drafts ==' -ForegroundColor Cyan

$archiveDir = Join-Path $repoRoot 'supabase\archive\2026-04-db-object-audit-drafts'
New-Item -ItemType Directory -Force -Path $archiveDir | Out-Null

$targets = @(
  'db-object-dependency-audit.sql',
  'db-object-dependency-audit-fixed.sql',
  'db-object-dependency-audit-minimal.sql',
  'block7-fixed.sql'
)

$moved = @()
$missing = @()

foreach ($target in $targets) {
  $sourcePath = Join-Path $repoRoot $target
  if (Test-Path $sourcePath) {
    $destinationPath = Join-Path $archiveDir $target
    Move-Item -Force $sourcePath $destinationPath
    $moved += [pscustomobject]@{ from = $target; to = ('supabase\\archive\\2026-04-db-object-audit-drafts\\' + $target) }
  } else {
    $missing += $target
  }
}

Write-Host ''
if ($moved.Count -gt 0) {
  Write-Host 'Moved files:' -ForegroundColor Green
  foreach ($item in $moved) {
    Write-Host ('- {0} -> {1}' -f $item.from, $item.to)
  }
} else {
  Write-Host 'No draft SQL files were moved.' -ForegroundColor Yellow
}

if ($missing.Count -gt 0) {
  Write-Host ''
  Write-Host 'Already absent / not found:' -ForegroundColor DarkYellow
  foreach ($item in $missing) {
    Write-Host ('- {0}' -f $item)
  }
}

Write-Host ''
Write-Host 'Recommended follow-up:' -ForegroundColor Cyan
Write-Host '1. Run verify SQL in Supabase: supabase/sql/verify-legacy-monetization-objects-absent.sql'
Write-Host '2. Rerun runtime audit'
Write-Host '3. Rerun pnpm validate'
