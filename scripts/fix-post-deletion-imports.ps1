Write-Host "== post-deletion fix =="
Write-Host ""

$partnerApi = ".\apps\admin\app\api\admin\partners"
if (Test-Path $partnerApi) {
  Write-Host "Removing orphaned partner API: $partnerApi"
  Remove-Item -Recurse -Force $partnerApi
} else {
  Write-Host "Partner API already absent."
}

Write-Host ""
Write-Host "Clearing stale build output"
Remove-Item -Recurse -Force .\apps\admin\.next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .\apps\user\.next -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Done."
