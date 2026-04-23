$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

Write-Host '== archive runtime audit temp files ==' -ForegroundColor Cyan

$archiveDir = Join-Path $repoRoot 'scripts\archive\2026-04-runtime-audit-temp-fixes'
New-Item -ItemType Directory -Force -Path $archiveDir | Out-Null

$targets = @(
  'scripts\db-runtime-audit-fixed.ps1',
  'scripts\db-runtime-audit-repair-v2.ps1',
  'scripts\db-runtime-audit-repair-v3.ps1',
  'db-runtime-audit-fixed.ps1',
  'db-runtime-audit-repair-v2.ps1',
  'db-runtime-audit-repair-v3.ps1'
)

$moved = @()
$missing = @()

foreach ($target in $targets) {
  $sourcePath = Join-Path $repoRoot $target
  if (Test-Path $sourcePath) {
    $leaf = Split-Path $sourcePath -Leaf
    $destinationPath = Join-Path $archiveDir $leaf
    Move-Item -Force $sourcePath $destinationPath
    $moved += [pscustomobject]@{ from = $target; to = ('scripts\\archive\\2026-04-runtime-audit-temp-fixes\\' + $leaf) }
  } else {
    $missing += $target
  }
}

if ($moved.Count -gt 0) {
  Write-Host 'Moved files:' -ForegroundColor Green
  foreach ($item in $moved) {
    Write-Host ('- {0} -> {1}' -f $item.from, $item.to)
  }
} else {
  Write-Host 'No runtime audit temp files found to archive.' -ForegroundColor Yellow
}
