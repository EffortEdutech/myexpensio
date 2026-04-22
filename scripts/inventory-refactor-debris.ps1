Write-Host "== myexpensio next PR inventory =="
Write-Host ""

$reportDir = ".\reports"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

Write-Host "1) Proxy / middleware file inventory"
Get-ChildItem -Path .\apps -Recurse -File |
  Where-Object { $_.Name -in @("middleware.ts", "proxy.ts") } |
  Sort-Object FullName |
  Select-Object FullName |
  Tee-Object -FilePath "$reportDir\proxy-middleware-files.txt"

Write-Host ""
Write-Host "2) Admin billing / referral / subscription candidate inventory"
$keywords = @(
  "billing",
  "commission",
  "referral",
  "affiliate",
  "subscription",
  "invoice",
  "price",
  "webhooks\\billing"
)

Get-ChildItem -Path .\apps\admin -Recurse -File |
  Where-Object {
    $path = $_.FullName.ToLower()
    $keywords | ForEach-Object { if ($path -match $_) { return $true } }
  } |
  Sort-Object FullName |
  Select-Object FullName |
  Tee-Object -FilePath "$reportDir\admin-refactor-candidates.txt"

Write-Host ""
Write-Host "3) Suggested manual deletions for this PR"
Write-Host "   Remove-Item .\apps\admin\middleware.ts"
Write-Host "   Remove-Item .\apps\user\middleware.ts"

Write-Host ""
Write-Host "Inventory reports written to .\reports"
