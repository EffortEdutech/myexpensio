Write-Host "== delete legacy admin monetization stack =="
Write-Host ""

$targets = @(
  ".\apps\admin\.env.billing.example",
  ".\apps\admin\app\(protected)\billing",
  ".\apps\admin\app\(protected)\referrals",
  ".\apps\admin\app\api\admin\billing",
  ".\apps\admin\app\api\admin\referrals",
  ".\apps\admin\app\api\admin\webhooks\billing",
  ".\apps\admin\components\billing",
  ".\apps\admin\lib\billing"
)

foreach ($target in $targets) {
  if (Test-Path $target) {
    Write-Host "Removing $target"
    Remove-Item -Recurse -Force $target
  } else {
    Write-Host "Skip (not found): $target"
  }
}

Write-Host ""
Write-Host "Clearing stale build output"
Remove-Item -Recurse -Force .\apps\admin\.next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .\apps\user\.next -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Done."
