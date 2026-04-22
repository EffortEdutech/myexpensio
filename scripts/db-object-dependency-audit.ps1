param(
  [string]$RepoRoot = (Get-Location).Path
)

$ErrorActionPreference = 'Stop'

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$outDir = Join-Path $RepoRoot 'audit-output\db-object-audit'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$reportMd = Join-Path $outDir ("db-object-audit-report-" + $timestamp + ".md")
$reportJson = Join-Path $outDir ("db-object-audit-report-" + $timestamp + ".json")

$candidates = @(
  'agents',
  'commission_plans',
  'commission_ledger',
  'referral_attributions',
  'referral_visits'
)

$excludeDirNames = @('.git', 'node_modules', '.next', 'dist', 'build', 'coverage', '.turbo', 'audit-output')
$interestingFiles = Get-ChildItem -Path $RepoRoot -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
  $name = $_.Name.ToLower()
  $ext = $_.Extension.ToLower()

  foreach ($dirName in $excludeDirNames) {
    if ($_.FullName -match [regex]::Escape("\" + $dirName + "\")) {
      return $false
    }
  }

  if ($_.FullName -like "*\docs\db-audit\*") { return $false }
  if ($_.FullName -like "*\docs\refactor\*") { return $false }

  if ($_.FullName -like "*\supabase\*") { return $true }
  if ($name -like '*types.ts') { return $true }
  if ($name -like '*schema*') { return $true }
  if ($ext -eq '.sql') { return $true }

  return $false
}

$results = @()

foreach ($table in $candidates) {
  $hits = Select-String -Path $interestingFiles.FullName -Pattern $table -SimpleMatch -CaseSensitive:$false -ErrorAction SilentlyContinue

  $rows = @()
  foreach ($hit in $hits) {
    $relativePath = Resolve-Path -LiteralPath $hit.Path | ForEach-Object {
      $_.Path.Substring($RepoRoot.Length).TrimStart('\')
    }

    $category = 'other'
    if ($relativePath -like 'supabase/*' -or $relativePath -like '*.sql') { $category = 'sql_or_schema' }
    if ($relativePath -like '*types.ts') { $category = 'type_residue' }
    if ($relativePath -like '*schema*') { $category = 'sql_or_schema' }

    $rows += [pscustomobject]@{
      table        = $table
      category     = $category
      relativePath = ($relativePath -replace '\\','/')
      lineNumber   = $hit.LineNumber
      line         = $hit.Line.Trim()
    }
  }

  $uniqueRows = $rows | Sort-Object relativePath, lineNumber -Unique

  $results += [pscustomobject]@{
    table               = $table
    hit_count           = ($uniqueRows | Measure-Object).Count
    type_residue_count  = (($uniqueRows | Where-Object { $_.category -eq 'type_residue' }) | Measure-Object).Count
    sql_or_schema_count = (($uniqueRows | Where-Object { $_.category -eq 'sql_or_schema' }) | Measure-Object).Count
    matches             = $uniqueRows
  }
}

$summary = [pscustomobject]@{
  generated_at = (Get-Date).ToString('s')
  repo_root = $RepoRoot
  scanned_file_count = $interestingFiles.Count
  candidates = $results
}

$summary | ConvertTo-Json -Depth 8 | Set-Content -Path $reportJson -Encoding UTF8

$md = New-Object System.Collections.Generic.List[string]
$null = $md.Add('# DB Object Audit Report')
$null = $md.Add('')
$null = $md.Add(('- Generated at: ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')))
$null = $md.Add(('- Repo root: ' + $RepoRoot))
$null = $md.Add(('- Scanned files: ' + $interestingFiles.Count))
$null = $md.Add('')
$null = $md.Add('| Table | Hits | Type Residue | SQL/Schema Hits |')
$null = $md.Add('|---|---:|---:|---:|')

foreach ($item in $results) {
  $null = $md.Add(('| ' + $item.table + ' | ' + $item.hit_count + ' | ' + $item.type_residue_count + ' | ' + $item.sql_or_schema_count + ' |'))
}

foreach ($item in $results) {
  $null = $md.Add('')
  $null = $md.Add(('## ' + $item.table))
  $null = $md.Add('')
  if ($item.hit_count -eq 0) {
    $null = $md.Add('No repo-side object hits found.')
    continue
  }

  foreach ($m in $item.matches) {
    $safeLine = $m.line.Replace('|', '\|')
    $null = $md.Add(('- [' + $m.category + '] ' + $m.relativePath + ':' + $m.lineNumber + ' -> ' + $safeLine))
  }
}

$null = $md.Add('')
$null = $md.Add('## Reviewer note')
$null = $md.Add('Repo-side results are only part of the audit.')
$null = $md.Add('Use sql/db-object-dependency-audit.sql to confirm live database dependencies.')

($md -join "`r`n") | Set-Content -Path $reportMd -Encoding UTF8

Write-Host '== db object dependency audit ==' -ForegroundColor Cyan
Write-Host ('Scanned files: ' + $interestingFiles.Count)
foreach ($item in $results) {
  Write-Host ('- ' + $item.table + ': ' + $item.hit_count + ' hits (' + $item.type_residue_count + ' type residue, ' + $item.sql_or_schema_count + ' sql/schema)')
}
Write-Host ''
Write-Host ('Markdown report: ' + $reportMd)
Write-Host ('JSON report:     ' + $reportJson)
