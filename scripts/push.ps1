# scripts/push.ps1
# Usage: .\scripts\push.ps1 "your commit message"
# Automates: add, commit, fetch, rebase, auto-fix package.json conflict, push

param(
    [Parameter(Mandatory=$true)]
    [string]$Message
)

$ErrorActionPreference = "Stop"
$PKG = "apps/user/package.json"

function Fix-PackageJson {
    $raw = Get-Content $PKG -Raw
    if ($raw -notmatch '<<<<<<<') { return $false }

    Write-Host "  Conflict in $PKG -- auto-resolving..." -ForegroundColor Yellow

    $lines  = $raw -split "`r?`n"
    $result = [System.Collections.Generic.List[string]]::new()
    $skip   = $false

    foreach ($line in $lines) {
        if ($line -match '^<<<<<<<') { $skip = $true;  continue }
        if ($line -match '^=======') { $skip = $false; continue }
        if ($line -match '^>>>>>>>') { $skip = $false; continue }
        if (-not $skip) { $result.Add($line) }
    }

    $fixed = $result -join "`n"

    # Collect all version strings from the conflicted file
    $versions = [System.Collections.Generic.List[string]]::new()
    foreach ($line in $lines) {
        if ($line -match '"version"') {
            $v = $line -replace '.*"version":\s*"', '' -replace '".*', ''
            if ($v -match '^\d+\.\d+\.\d+$') { $versions.Add($v) }
        }
    }

    if ($versions.Count -ge 1) {
        $winner = ($versions | Sort-Object {
            $p = $_ -split '\.'
            [int]$p[0] * 1000000 + [int]$p[1] * 1000 + [int]$p[2]
        } -Descending)[0]
        $fixed = $fixed -replace '"version":\s*"[0-9.]*"', ('"version": "' + $winner + '"')
        Write-Host "  Version set to $winner" -ForegroundColor Green
    }

    Set-Content $PKG $fixed -NoNewline
    return $true
}

Write-Host ""
Write-Host "==> git add -A" -ForegroundColor Cyan
git add -A

Write-Host "==> git commit" -ForegroundColor Cyan
git commit -m $Message
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Nothing to commit or already committed." -ForegroundColor Yellow
}

Write-Host "==> git fetch origin" -ForegroundColor Cyan
git fetch origin

Write-Host "==> git rebase origin/main" -ForegroundColor Cyan
git rebase origin/main

if ($LASTEXITCODE -ne 0) {
    $fixed = Fix-PackageJson
    if ($fixed) {
        git add $PKG
        $env:GIT_EDITOR = "true"
        Write-Host "==> git rebase --continue" -ForegroundColor Cyan
        git rebase --continue
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Rebase --continue failed. Resolve manually." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Could not auto-fix conflict. Resolve manually." -ForegroundColor Red
        exit 1
    }
}

Write-Host "==> git push origin main" -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Push successful!" -ForegroundColor Green
} else {
    Write-Host "Push failed." -ForegroundColor Red
    exit 1
}
