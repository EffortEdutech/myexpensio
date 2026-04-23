$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

Write-Host '== final release lock check ==' -ForegroundColor Cyan

$requiredPaths = @(
  'apps\user',
  'apps\admin',
  'scripts\db-runtime-audit.ps1',
  'scripts\type-sync-schema-residue-audit.ps1',
  'docs\refactor'
)

$forbiddenPaths = @(
  'apps\admin\app\api\admin\billing',
  'apps\admin\app\api\admin\referrals',
  'apps\admin\app\api\admin\partners',
  'apps\admin\app\api\admin\webhooks\billing',
  'apps\admin\app\(protected)\billing',
  'apps\admin\app\(protected)\referrals'
)

$requiredScripts = @(
  'validate',
  'audit:db-runtime',
  'audit:db-runtime:strict',
  'validate:guardrails',
  'validate:full'
)

$errors = New-Object System.Collections.Generic.List[string]
$passes = New-Object System.Collections.Generic.List[string]

foreach ($path in $requiredPaths) {
  if (Test-Path (Join-Path $repoRoot $path)) {
    $null = $passes.Add("Required path present: $path")
  } else {
    $null = $errors.Add("Missing required path: $path")
  }
}

foreach ($path in $forbiddenPaths) {
  if (Test-Path (Join-Path $repoRoot $path)) {
    $null = $errors.Add("Forbidden legacy path still exists: $path")
  } else {
    $null = $passes.Add("Forbidden legacy path absent: $path")
  }
}

$packageJsonPath = Join-Path $repoRoot 'package.json'
if (-not (Test-Path $packageJsonPath)) {
  $null = $errors.Add('Missing package.json')
} else {
  $package = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
  foreach ($scriptName in $requiredScripts) {
    $scriptValue = $package.scripts.$scriptName
    if ([string]::IsNullOrWhiteSpace($scriptValue)) {
      $null = $errors.Add("Missing npm script: $scriptName")
    } else {
      $null = $passes.Add("npm script present: $scriptName")
    }
  }
}

$gitignorePath = Join-Path $repoRoot '.gitignore'
if (Test-Path $gitignorePath) {
  $gitignore = Get-Content $gitignorePath -Raw
  if ($gitignore -match '(?m)^audit-output/$') {
    $null = $passes.Add('.gitignore contains audit-output/')
  } else {
    $null = $errors.Add('.gitignore missing audit-output/')
  }
} else {
  $null = $errors.Add('Missing .gitignore')
}

if ($errors.Count -eq 0) {
  Write-Host 'PASS' -ForegroundColor Green
  foreach ($line in $passes) {
    Write-Host ('- ' + $line)
  }
  exit 0
}

Write-Host 'FAIL' -ForegroundColor Red
foreach ($line in $errors) {
  Write-Host ('- ' + $line) -ForegroundColor Red
}
exit 1
