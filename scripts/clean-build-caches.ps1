$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$targets = @(
  'apps\user\.next',
  'apps\admin\.next',
  '.turbo'
)

Write-Host '== clean build caches ==' -ForegroundColor Cyan

foreach ($relativePath in $targets) {
  $fullPath = Join-Path $repoRoot $relativePath
  if (Test-Path $fullPath) {
    Write-Host ("Removing {0}" -f $relativePath)
    Remove-Item -Recurse -Force $fullPath -ErrorAction SilentlyContinue
  } else {
    Write-Host ("Skipping {0} (not found)" -f $relativePath)
  }
}

Write-Host ''
Write-Host 'Done.'
