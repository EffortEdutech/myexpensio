param(
  [switch]$IncludeScripts,
  [switch]$IncludeDocs,
  [switch]$FailOnHits
)

$ErrorActionPreference = 'Stop'

function Get-RepoRoot {
  if ($PSScriptRoot) {
    return (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
  }
  return (Get-Location).Path
}

function Test-IgnoredPath {
  param(
    [string]$RelativePath,
    [string[]]$IgnoreNeedles
  )

  $normalized = $RelativePath.Replace('/', '\')
  foreach ($needle in $IgnoreNeedles) {
    if ($normalized -like $needle) {
      return $true
    }
  }
  return $false
}

$repoRoot = Get-RepoRoot
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$outDir = Join-Path $repoRoot 'audit-output\db-runtime-audit'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$legacyTargets = @(
  @{ table = 'agents'; keywords = @('agents', 'agent_code', 'commission_plan_id', 'parent_agent_id') },
  @{ table = 'commission_plans'; keywords = @('commission_plans', 'billing_cycle', 'grace_days') },
  @{ table = 'commission_ledger'; keywords = @('commission_ledger', 'commission_amount', 'payout_batch_id') },
  @{ table = 'referral_attributions'; keywords = @('referral_attributions', 'attributed_at') },
  @{ table = 'referral_visits'; keywords = @('referral_visits', 'landing_path', 'utm_source') },
  @{ table = 'v_partner_commission_summary'; keywords = @('v_partner_commission_summary') }
)

$searchRoots = @('apps')
if (Test-Path (Join-Path $repoRoot 'packages')) { $searchRoots += 'packages' }
if (Test-Path (Join-Path $repoRoot 'lib')) { $searchRoots += 'lib' }
if ($IncludeScripts -and (Test-Path (Join-Path $repoRoot 'scripts'))) { $searchRoots += 'scripts' }
if ($IncludeDocs -and (Test-Path (Join-Path $repoRoot 'docs'))) { $searchRoots += 'docs' }

$allowedExtensions = @('.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.sql')
if ($IncludeScripts) { $allowedExtensions += '.ps1' }
if ($IncludeDocs) { $allowedExtensions += '.md' }

$ignoreNeedles = @(
  '*\node_modules\*',
  '*\.next\*',
  '*\dist\*',
  '*\build\*',
  '*\coverage\*',
  '*\audit-output\*',
  '*\scripts\archive\*',
  '*\docs\archive\*'
)

$files = @()
foreach ($root in $searchRoots | Select-Object -Unique) {
  $rootPath = Join-Path $repoRoot $root
  if (-not (Test-Path $rootPath)) { continue }

  $files += Get-ChildItem -Path $rootPath -Recurse -File | Where-Object {
    $ext = [System.IO.Path]::GetExtension($_.FullName).ToLowerInvariant()
    if ($allowedExtensions -notcontains $ext) { return $false }

    $relativePath = $_.FullName.Substring($repoRoot.Length).TrimStart('\', '/')
    return -not (Test-IgnoredPath -RelativePath $relativePath -IgnoreNeedles $ignoreNeedles)
  }
}

$files = $files | Sort-Object FullName -Unique
$results = @()
$summary = @()

foreach ($target in $legacyTargets) {
  $tableMatches = @()

  foreach ($file in $files) {
    $relativePath = $file.FullName.Substring($repoRoot.Length).TrimStart('\', '/')
    $lines = Get-Content -Path $file.FullName
    $matches = @()

    for ($i = 0; $i -lt $lines.Count; $i++) {
      $line = $lines[$i]
      foreach ($keyword in $target.keywords) {
        if ($line -match [regex]::Escape($keyword)) {
          $matches += [pscustomobject]@{
            lineNumber = $i + 1
            keyword = $keyword
            line = $line.Trim()
          }
        }
      }
    }

    if ($matches.Count -gt 0) {
      $tableMatches += [pscustomobject]@{
        file = $relativePath
        matches = $matches
      }
    }
  }

  if ($tableMatches.Count -gt 0) {
    $uniqueCount = 0
    foreach ($entry in $tableMatches) { $uniqueCount += $entry.matches.Count }

    $results += [pscustomobject]@{
      table = $target.table
      file_count = $tableMatches.Count
      unique_match_count = $uniqueCount
      files = $tableMatches
    }
  }

  $summary += [pscustomobject]@{
    table = $target.table
    file_count = $tableMatches.Count
    unique_match_count = if ($tableMatches.Count -gt 0) { ($tableMatches | ForEach-Object { $_.matches.Count } | Measure-Object -Sum).Sum } else { 0 }
  }
}

$report = [pscustomobject]@{
  generated_at = (Get-Date).ToString('s')
  scanned_file_count = $files.Count
  search_roots = $searchRoots
  include_scripts = [bool]$IncludeScripts
  include_docs = [bool]$IncludeDocs
  results = $results
  summary = $summary
}

$jsonPath = Join-Path $outDir ("db-runtime-audit-report-{0}.json" -f $timestamp)
$mdPath = Join-Path $outDir ("db-runtime-audit-report-{0}.md" -f $timestamp)
$report | ConvertTo-Json -Depth 10 | Set-Content -Path $jsonPath -Encoding UTF8

$md = New-Object System.Collections.Generic.List[string]
$md.Add('# DB Runtime Audit Report')
$md.Add('')
$md.Add(("Generated at: {0}" -f $report.generated_at))
$md.Add(("Scanned files: {0}" -f $files.Count))
$md.Add(("Search roots: {0}" -f (($searchRoots | Select-Object -Unique) -join ', ')))
$md.Add('')
$md.Add('| Legacy object | Files | Matching lines |')
$md.Add('|---|---:|---:|')
foreach ($row in $summary) {
  $md.Add(("| {0} | {1} | {2} |" -f $row.table, $row.file_count, $row.unique_match_count))
}
$md.Add('')

if ($results.Count -eq 0) {
  $md.Add('No runtime hits found in the selected search roots.')
} else {
  foreach ($row in $results) {
    $md.Add(("## {0}" -f $row.table))
    $md.Add('')
    foreach ($file in $row.files) {
      $md.Add(("### {0}" -f $file.file))
      foreach ($match in $file.matches) {
        $md.Add(("- line {0} - keyword `{1}` - `{2}`" -f $match.lineNumber, $match.keyword, $match.line))
      }
      $md.Add('')
    }
  }
}

$md | Set-Content -Path $mdPath -Encoding UTF8

Write-Host '== database runtime audit ==' -ForegroundColor Cyan
Write-Host ("Scanned files: {0}" -f $files.Count)
foreach ($row in $summary) {
  if ($row.file_count -gt 0) {
    Write-Host ("- {0}: {1} files, {2} matching lines" -f $row.table, $row.file_count, $row.unique_match_count)
  }
}
Write-Host ''
Write-Host ("Markdown report: {0}" -f $mdPath)
Write-Host ("JSON report:     {0}" -f $jsonPath)

$runtimeHitCount = ($summary | Where-Object { $_.unique_match_count -gt 0 } | Measure-Object).Count
if ($FailOnHits -and $runtimeHitCount -gt 0) {
  Write-Error 'Legacy DB runtime residue still exists in runtime code.'
}
