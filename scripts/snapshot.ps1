Write-Host "=== SNAPSHOT ==="
Write-Host ("Time: " + (Get-Date))
Write-Host ""

Write-Host "== git status =="
git status
Write-Host ""

Write-Host "== git diff --stat =="
git diff --stat
Write-Host ""

Write-Host "== last commit =="
git log -1 --oneline
Write-Host ""

Write-Host "== tree (apps) =="
Get-ChildItem .\apps -Recurse -Directory | Select-Object FullName