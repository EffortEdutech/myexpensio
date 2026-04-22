Write-Host "== myexpensio cleanup / stabilization =="
Write-Host ""

Write-Host "1) Nested pnpm-workspace.yaml audit"
Get-ChildItem -Path . -Recurse -Filter pnpm-workspace.yaml |
  Select-Object FullName

Write-Host ""
Write-Host "2) Remove stale Next.js build folders"
Remove-Item -Recurse -Force .\apps\admin\.next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .\apps\user\.next -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "3) Reinstall workspace dependencies"
pnpm install

Write-Host ""
Write-Host "4) Run production builds"
pnpm validate

Write-Host ""
Write-Host "Done."
