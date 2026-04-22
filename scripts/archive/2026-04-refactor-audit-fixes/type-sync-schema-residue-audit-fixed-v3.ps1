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

$files = @(Get-ChildItem -Recurse -File | Where-Object {
  (-not (Test-IsExcludedPath $_.FullName)) -and ($includeExtensions -contains $_.Extension.ToLowerInvariant())
})

$results = New-Object System.Collections.ArrayList

foreach ($file in $files) {
  $rel = Resolve-Path -Relative $file.FullName
  $rel = $rel -replace '^\.[\\/]', ''

  try {
    $content = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8
  } catch {
    continue
  }

  $hitList = New-Object System.Collections.ArrayList
  $lineNo = 0

  foreach ($line in ($content -split "`r?`n")) {
    $lineNo++
    foreach ($term in $legacyTerms) {
      if ($line -match [regex]::Escape($term)) {
        [void]$hitList.Add([pscustomobject]@{
          term = $term
          lineNumber = $lineNo
          line = $line.Trim()
        })
      }
    }
  }

  if ($hitList.Count -gt 0) {
    [void]$results.Add([pscustomobject]@{
      file = $rel
      likelyTypeFile = (Test-IsLikelyTypeFile $rel)
      docsOnlyPath = (Test-IsDocsOnlyPath $rel)
      matchCount = $hitList.Count
      matches = @($hitList)
    })
  }
}

$runtimeHits = @($results | Where-Object { -not $_.docsOnlyPath })
$typeHits = @($results | Where-Object { $_.likelyTypeFile })
$docsHits = @($results | Where-Object { $_.docsOnlyPath })

$summaryByTerm = @(
  foreach ($term in $legacyTerms) {
    $count = 0
    foreach ($r in $results) {
      $count += @($r.matches | Where-Object { $_.term -eq $term }).Count
    }
    [pscustomobject]@{
      term = $term
      match_count = $count
    }
  }
)

$payload = [pscustomobject]@{
  generated_at = (Get-Date).ToString('s')
  scanned_file_count = $files.Count
  residue_file_count = $results.Count
  runtime_hit_file_count = $runtimeHits.Count
  likely_type_file_count = $typeHits.Count
  docs_only_file_count = $docsHits.Count
  legacy_terms = $legacyTerms
  summary_by_term = $summaryByTerm
  files = @($results)
}

$payload | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $jsonPath -Encoding UTF8

$md = New-Object System.Collections.ArrayList
[void]$md.Add('# Type Sync + Schema Residue Audit')
[void]$md.Add('')
[void]$md.Add('Generated: ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))
[void]$md.Add('')
[void]$md.Add('Scanned files: ' + $files.Count)
[void]$md.Add('Residue files: ' + $results.Count)
[void]$md.Add('Runtime hit files: ' + $runtimeHits.Count)
[void]$md.Add('Likely type files with hits: ' + $typeHits.Count)
[void]$md.Add('Docs-only files with hits: ' + $docsHits.Count)
[void]$md.Add('')
[void]$md.Add('## Summary by term')
[void]$md.Add('')
[void]$md.Add('| Term | Match Count |')
[void]$md.Add('|---|---:|')

foreach ($item in $summaryByTerm) {
  [void]$md.Add('| ' + $item.term + ' | ' + $item.match_count + ' |')
}

[void]$md.Add('')
[void]$md.Add('## Likely type files')
[void]$md.Add('')

if ($typeHits.Count -eq 0) {
  [void]$md.Add('_No likely type files with residue hits found._')
} else {
  foreach ($item in ($typeHits | Sort-Object file)) {
    [void]$md.Add('- `' + $item.file + '` (' + $item.matchCount + ' matches)')
  }
}

[void]$md.Add('')
[void]$md.Add('## Runtime hits')
[void]$md.Add('')

if ($runtimeHits.Count -eq 0) {
  [void]$md.Add('_No runtime hit files found._')
} else {
  foreach ($item in ($runtimeHits | Sort-Object file)) {
    [void]$md.Add('### `' + $item.file + '`')
    foreach ($m in $item.matches) {
      [void]$md.Add('- line ' + $m.lineNumber + ' - term `' + $m.term + '` - `' + $m.line + '`')
    }
    [void]$md.Add('')
  }
}

[void]$md.Add('## Docs-only hits')
[void]$md.Add('')

if ($docsHits.Count -eq 0) {
  [void]$md.Add('_No docs-only hit files found._')
} else {
  foreach ($item in ($docsHits | Sort-Object file)) {
    [void]$md.Add('- `' + $item.file + '` (' + $item.matchCount + ' matches)')
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
