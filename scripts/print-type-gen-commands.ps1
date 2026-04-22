param()

Write-Host "== suggested Supabase type generation commands ==" -ForegroundColor Cyan
Write-Host ""
Write-Host "Linked project:" -ForegroundColor Yellow
Write-Host "  supabase gen types typescript --linked --schema public > apps/admin/lib/types.ts"
Write-Host "  supabase gen types typescript --linked --schema public > apps/user/lib/types.ts"
Write-Host ""
Write-Host "Local project:" -ForegroundColor Yellow
Write-Host "  supabase gen types typescript --local --schema public > apps/admin/lib/types.ts"
Write-Host "  supabase gen types typescript --local --schema public > apps/user/lib/types.ts"
Write-Host ""
Write-Host "If your repo uses a shared DB type file, redirect to that shared file instead."
