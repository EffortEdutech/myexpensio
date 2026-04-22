$src = Join-Path (Get-Location) 'type-sync-schema-residue-audit-fixed-v3.ps1'
$dst = Join-Path (Get-Location) 'scripts\type-sync-schema-residue-audit.ps1'
if (-not (Test-Path $src)) {
  Write-Error "Missing file: $src"
  exit 1
}
New-Item -ItemType Directory -Force -Path (Split-Path $dst -Parent) | Out-Null
Copy-Item -LiteralPath $src -Destination $dst -Force
Write-Host "Rewrote: $dst"
Write-Host "Now run:"
Write-Host "powershell -ExecutionPolicy Bypass -File .\scripts\type-sync-schema-residue-audit.ps1"
