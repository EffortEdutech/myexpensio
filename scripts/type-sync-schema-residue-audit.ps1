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
$outDir = Join-Path $repoRoot 'audit-output\type-sync-residue'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$legacyTerms = @(
  'agents',
  'commission_plans',
  'commission_ledger',
  'referral_attributions',
  'referral_visits',
  'v_partner_commission_summary',
  'commission_plan_id',
  'agent_code',
  'parent_agent_id',
  'payout_batch_id',
  'commission_amount',
  'landing_path',
  'utm_source',
  'attributed_at'
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
$summaryMap = @{}
foreach ($term in $legacyTerms) {
  $summaryMap[$term] = 0
}

foreach ($file in $files) {
  $relativePath = $file.FullName.Substring($repoRoot.Length).TrimStart('\', '/')
  $lines = Get-Content -Path $file.FullName
  $matches = @()

  for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    foreach ($term in $legacyTerms) {
      if ($line -match [regex]::Escape($term)) {
        $matches += [pscustomobject]@{
          lineNumber = $i + 1
          term = $term
          line = $line.Trim()
        }
        $summaryMap[$term] = [int]$summaryMap[$term] + 1
      }
    }
  }

  if ($matches.Count -gt 0) {
    $bucket = 'runtime'
    if ($relativePath -like 'docs\*' -or $relativePath -like 'docs/*') {
      $bucket = 'docs'
    } elseif ($relativePath -like 'scripts\*' -or $relativePath -like 'scripts/*') {
      $bucket = 'scripts'
    }

    $results += [pscustomobject]@{
      file = $relativePath
      bucket = $bucket
      matches = $matches
    }
  }
}

$summary = @()
foreach ($term in $legacyTerms) {
  $summary += [pscustomobject]@{
    term = $term
    match_count = [int]$summaryMap[$term]
  }
}

$runtimeResults = @($results | Where-Object { $_.bucket -eq 'runtime' })
$docsResults = @($results | Where-Object { $_.bucket -eq 'docs' })
$scriptsResults = @($results | Where-Object { $_.bucket -eq 'scripts' })

$report = [pscustomobject]@{
  generated_at = (Get-Date).ToString('s')
  scanned_file_count = $files.Count
  runtime_hit_file_count = $runtimeResults.Count
  docs_hit_file_count = $docsResults.Count
  scripts_hit_file_count = $scriptsResults.Count
  search_roots = $searchRoots
  include_scripts = [bool]$IncludeScripts
  include_docs = [bool]$IncludeDocs
  summary_by_term = $summary
  files = $results
}

$jsonPath = Join-Path $outDir ("type-sync-residue-report-{0}.json" -f $timestamp)
$mdPath = Join-Path $outDir ("type-sync-residue-report-{0}.md" -f $timestamp)
$report | ConvertTo-Json -Depth 10 | Set-Content -Path $jsonPath -Encoding UTF8

$md = New-Object System.Collections.Generic.List[string]
$md.Add('# Type Sync + Schema Residue Audit Report')
$md.Add('')
$md.Add(("Generated at: {0}" -f $report.generated_at))
$md.Add(("Scanned files: {0}" -f $files.Count))
$md.Add(("Search roots: {0}" -f (($searchRoots | Select-Object -Unique) -join ', ')))
$md.Add(("Runtime hit files: {0}" -f $runtimeResults.Count))
$md.Add(("Docs hit files: {0}" -f $docsResults.Count))
$md.Add(("Scripts hit files: {0}" -f $scriptsResults.Count))
$md.Add('')
$md.Add('| Term | Matches |')
$md.Add('|---|---:|')
foreach ($row in $summary) {
  if ($row.match_count -gt 0) {
    $md.Add(("| {0} | {1} |" -f $row.term, $row.match_count))
  }
}
$md.Add('')

if ($results.Count -eq 0) {
  $md.Add('No residue hits found in the selected search roots.')
} else {
  foreach ($bucketName in @('runtime', 'scripts', 'docs')) {
    $bucketResults = @($results | Where-Object { $_.bucket -eq $bucketName })
    if ($bucketResults.Count -eq 0) { continue }

    $md.Add(("## {0}" -f ($bucketName.Substring(0,1).ToUpper() + $bucketName.Substring(1))))
    $md.Add('')
    foreach ($file in $bucketResults) {
      $md.Add(("### {0}" -f $file.file))
      foreach ($match in $file.matches) {
        $md.Add(("- line {0} - term `{1}` - `{2}`" -f $match.lineNumber, $match.term, $match.line))
      }
      $md.Add('')
    }
  }
}

$md | Set-Content -Path $mdPath -Encoding UTF8

Write-Host '== type sync + schema residue audit ==' -ForegroundColor Cyan
Write-Host ("Scanned files: {0}" -f $files.Count)
Write-Host ("Runtime hit files: {0}" -f $runtimeResults.Count)
Write-Host ("Scripts hit files: {0}" -f $scriptsResults.Count)
Write-Host ("Docs hit files: {0}" -f $docsResults.Count)
Write-Host ''
Write-Host ("Markdown report: {0}" -f $mdPath)
Write-Host ("JSON report:     {0}" -f $jsonPath)

if ($FailOnHits -and $runtimeResults.Count -gt 0) {
  Write-Error 'Schema/type residue still exists in runtime code.'
}
