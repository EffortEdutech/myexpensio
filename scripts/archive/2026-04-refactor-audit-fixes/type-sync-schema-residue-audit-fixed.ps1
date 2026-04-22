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

  $matches = New-Object System.Collections.Generic.List[object]
  $lineNo = 0

  foreach ($line in ($content -split "`r?`n")) {
    $lineNo++
    foreach ($term in $legacyTerms) {
      if ($line -match [regex]::Escape($term)) {
        $matches.Add([pscustomobject]@{
          term = $term
          lineNumber = $lineNo
          line = $line.Trim()
        })
      }
    }
  }

  if ($matches.Count -gt 0) {
    $results.Add([pscustomobject]@{
      file = $rel
      likelyTypeFile = (Test-IsLikelyTypeFile $rel)
      docsOnlyPath = (Test-IsDocsOnlyPath $rel)
      matchCount = $matches.Count
      matches = $matches
    })
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
  summary_by_term = $summaryByTerm
  files = $results
}

$payload | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $jsonPath -Encoding UTF8

$md = New-Object System.Collections.Generic.List[string]
$md.Add('# Type Sync + Schema Residue Audit')
$md.Add('')
$md.Add('Generated: ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))
$md.Add('')
$md.Add('Scanned files: ' + $files.Count)
$md.Add('Residue files: ' + $results.Count)
$md.Add('Runtime hit files: ' + $runtimeHits.Count)
$md.Add('Likely type files with hits: ' + $typeHits.Count)
$md.Add('Docs-only files with hits: ' + $docsHits.Count)
$md.Add('')
$md.Add('## Summary by term')
$md.Add('')
$md.Add('| Term | Match Count |')
$md.Add('|---|---:|')

foreach ($item in $summaryByTerm) {
  $md.Add('| ' + $item.term + ' | ' + $item.match_count + ' |')
}

$md.Add('')
$md.Add('## Likely type files')
$md.Add('')

if ($typeHits.Count -eq 0) {
  $md.Add('_No likely type files with residue hits found._')
} else {
  foreach ($file in ($typeHits | Sort-Object file)) {
    $md.Add('- `' + $file.file + '` (' + $file.matchCount + ' matches)')
  }
}

$md.Add('')
$md.Add('## Runtime hits')
$md.Add('')

if ($runtimeHits.Count -eq 0) {
  $md.Add('_No runtime hit files found._')
} else {
  foreach ($file in ($runtimeHits | Sort-Object file)) {
    $md.Add('### `' + $file.file + '`')
    foreach ($m in $file.matches) {
      $md.Add('- line ' + $m.lineNumber + ' - term `' + $m.term + '` - `' + $m.line + '`')
    }
    $md.Add('')
  }
}

$md.Add('## Docs-only hits')
$md.Add('')

if ($docsHits.Count -eq 0) {
  $md.Add('_No docs-only hit files found._')
} else {
  foreach ($file in ($docsHits | Sort-Object file)) {
    $md.Add('- `' + $file.file + '` (' + $file.matchCount + ' matches)')
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
