param()

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

Write-Host '== type sync + schema residue audit ==' -ForegroundColor Cyan

$repoRoot = Get-Location
$outDir = Join-Path $repoRoot 'audit-output\type-sync-residue'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$mdPath = Join-Path $outDir ('type-sync-residue-report-' + $timestamp + '.md')
$jsonPath = Join-Path $outDir ('type-sync-residue-report-' + $timestamp + '.json')

$excludeDirs = @('.git', 'node_modules', '.next', '.vercel', 'audit-output', 'coverage', 'dist', 'build')
$includeExtensions = @('.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.sql', '.md', '.json', '.ps1')
$legacyTerms = @(
  'agents',
  'commission_plans',
  'commission_ledger',
  'referral_attributions',
  'referral_visits',
  'v_partner_commission_summary',
  'commission_plan_id'
)

function Test-IsExcludedPath {
  param([string]$FullName)
  foreach ($frag in $excludeDirs) {
    if ($FullName -like ('*' + $frag + '*')) { return $true }
  }
  return $false
}

function Test-IsLikelyTypeFile {
  param([string]$RelativePath)
  $p = $RelativePath.ToLowerInvariant()
  if ($p -match '(^|/|\\)lib(/|\\)types\.ts$') { return $true }
  if ($p -match 'types\.ts$') { return $true }
  if ($p -match 'database.*\.ts$') { return $true }
  if ($p -match 'supabase.*\.ts$') { return $true }
  return $false
}

function Test-IsDocsOnlyPath {
  param([string]$RelativePath)
  $p = $RelativePath.ToLowerInvariant()
  if ($p.StartsWith('docs\')) { return $true }
  if ($p.StartsWith('docs/')) { return $true }
  if ($p.EndsWith('.md')) { return $true }
  return $false
}

$files = Get-ChildItem -Recurse -File | Where-Object {
  (-not (Test-IsExcludedPath $_.FullName)) -and ($includeExtensions -contains $_.Extension.ToLowerInvariant())
}

$results = New-Object System.Collections.Generic.List[object]

foreach ($file in $files) {
  $rel = Resolve-Path -Relative $file.FullName
  $rel = $rel -replace '^\.[\\/]', ''

  try {
    $content = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8
  } catch {
    continue
  }

  $hitList = New-Object System.Collections.Generic.List[object]
  $lineNo = 0

  foreach ($line in ($content -split "`r?`n")) {
    $lineNo++
    foreach ($term in $legacyTerms) {
      if ($line -match [regex]::Escape($term)) {
        $hitList.Add([pscustomobject]@{
          term = $term
          lineNumber = $lineNo
          line = $line.Trim()
        }) | Out-Null
      }
    }
  }

  if ($hitList.Count -gt 0) {
    $results.Add([pscustomobject]@{
      file = $rel
      likelyTypeFile = (Test-IsLikelyTypeFile $rel)
      docsOnlyPath = (Test-IsDocsOnlyPath $rel)
      matchCount = $hitList.Count
      matches = @($hitList)
    }) | Out-Null
  }
}

$runtimeHits = @($results | Where-Object { -not $_.docsOnlyPath })
$typeHits = @($results | Where-Object { $_.likelyTypeFile })
$docsHits = @($results | Where-Object { $_.docsOnlyPath })

$summaryByTerm = foreach ($term in $legacyTerms) {
  $count = 0
  foreach ($r in $results) {
    $count += @($r.matches | Where-Object { $_.term -eq $term }).Count
  }
  [pscustomobject]@{
    term = $term
    match_count = $count
  }
}

$payload = [pscustomobject]@{
  generated_at = (Get-Date).ToString('s')
  scanned_file_count = $files.Count
  residue_file_count = $results.Count
  runtime_hit_file_count = $runtimeHits.Count
  likely_type_file_count = $typeHits.Count
  docs_only_file_count = $docsHits.Count
  legacy_terms = $legacyTerms
  summary_by_term = @($summaryByTerm)
  files = @($results)
}

$payload | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $jsonPath -Encoding UTF8

$md = New-Object System.Collections.Generic.List[string]
$md.Add('# Type Sync + Schema Residue Audit') | Out-Null
$md.Add('') | Out-Null
$md.Add('Generated: ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')) | Out-Null
$md.Add('') | Out-Null
$md.Add('Scanned files: ' + $files.Count) | Out-Null
$md.Add('Residue files: ' + $results.Count) | Out-Null
$md.Add('Runtime hit files: ' + $runtimeHits.Count) | Out-Null
$md.Add('Likely type files with hits: ' + $typeHits.Count) | Out-Null
$md.Add('Docs-only files with hits: ' + $docsHits.Count) | Out-Null
$md.Add('') | Out-Null
$md.Add('## Summary by term') | Out-Null
$md.Add('') | Out-Null
$md.Add('| Term | Match Count |') | Out-Null
$md.Add('|---|---:|') | Out-Null

foreach ($item in $summaryByTerm) {
  $md.Add('| ' + $item.term + ' | ' + $item.match_count + ' |') | Out-Null
}

$md.Add('') | Out-Null
$md.Add('## Likely type files') | Out-Null
$md.Add('') | Out-Null

if ($typeHits.Count -eq 0) {
  $md.Add('_No likely type files with residue hits found._') | Out-Null
} else {
  foreach ($file in ($typeHits | Sort-Object file)) {
    $md.Add('- `' + $file.file + '` (' + $file.matchCount + ' matches)') | Out-Null
  }
}

$md.Add('') | Out-Null
$md.Add('## Runtime hits') | Out-Null
$md.Add('') | Out-Null

if ($runtimeHits.Count -eq 0) {
  $md.Add('_No runtime hit files found._') | Out-Null
} else {
  foreach ($file in ($runtimeHits | Sort-Object file)) {
    $md.Add('### `' + $file.file + '`') | Out-Null
    foreach ($m in $file.matches) {
      $md.Add('- line ' + $m.lineNumber + ' - term `' + $m.term + '` - `' + $m.line + '`') | Out-Null
    }
    $md.Add('') | Out-Null
  }
}

$md.Add('## Docs-only hits') | Out-Null
$md.Add('') | Out-Null

if ($docsHits.Count -eq 0) {
  $md.Add('_No docs-only hit files found._') | Out-Null
} else {
  foreach ($file in ($docsHits | Sort-Object file)) {
    $md.Add('- `' + $file.file + '` (' + $file.matchCount + ' matches)') | Out-Null
  }
}

($md -join "`r`n") | Set-Content -LiteralPath $mdPath -Encoding UTF8

Write-Host ('Scanned files: ' + $files.Count)
Write-Host ('Residue files: ' + $results.Count)
Write-Host ('Runtime hit files: ' + $runtimeHits.Count)
Write-Host ('Likely type files with hits: ' + $typeHits.Count)
Write-Host ('Docs-only files with hits: ' + $docsHits.Count)
Write-Host ''
Write-Host ('Markdown report: ' + $mdPath)
Write-Host ('JSON report:     ' + $jsonPath)
