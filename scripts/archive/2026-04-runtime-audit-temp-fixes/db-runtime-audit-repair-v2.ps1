
param(
  [switch]$FailOnHits
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

Write-Host '== database runtime audit =='

$patterns = @(
  'agents',
  'commission_plans',
  'commission_ledger',
  'referral_attributions',
  'referral_visits'
)

$includeExtensions = @('.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.sql')
$excludeDirs = @(
  '.git',
  'node_modules',
  '.next',
  '.turbo',
  'dist',
  'build',
  'coverage',
  'audit-output',
  'docs',
  'scripts\\archive',
  'archive'
)

function Test-ExcludedPath {
  param([string]$Path)
  foreach ($dir in $excludeDirs) {
    if ($Path -match [regex]::Escape([IO.Path]::DirectorySeparatorChar + $dir + [IO.Path]::DirectorySeparatorChar)) {
      return $true
    }
    if ($Path -match [regex]::Escape('/' + $dir + '/')) {
      return $true
    }
    if ($Path -match [regex]::Escape('\' + $dir + '\')) {
      return $true
    }
  }
  return $false
}

$files = Get-ChildItem -Path . -Recurse -File |
  Where-Object {
    ($includeExtensions -contains $_.Extension) -and
    -not (Test-ExcludedPath $_.FullName)
  }

$results = @()

foreach ($term in $patterns) {
  $fileHits = @()

  foreach ($file in $files) {
    $matches = Select-String -Path $file.FullName -Pattern $term -SimpleMatch -CaseSensitive:$false -ErrorAction SilentlyContinue

    if ($matches) {
      $normalizedMatches = @()
      foreach ($m in $matches) {
        $relativePath = [IO.Path]::GetRelativePath($repoRoot, $m.Path)
        $normalizedMatches += [pscustomobject]@{
          lineNumber = $m.LineNumber
          keyword    = $term
          line       = ($m.Line.Trim())
          file       = $relativePath
        }
      }

      $fileHits += [pscustomobject]@{
        file    = [IO.Path]::GetRelativePath($repoRoot, $file.FullName)
        matches = $normalizedMatches
      }
    }
  }

  if ($fileHits.Count -gt 0) {
    $matchCount = 0
    foreach ($fh in $fileHits) {
      $matchCount += $fh.matches.Count
    }

    $results += [pscustomobject]@{
      table              = $term
      file_count         = $fileHits.Count
      unique_match_count = $matchCount
      files              = $fileHits
    }
  }
}

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$outDir = Join-Path $repoRoot 'audit-output\db-runtime-audit'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$jsonPath = Join-Path $outDir ("db-runtime-audit-report-{0}.json" -f $timestamp)
$mdPath   = Join-Path $outDir ("db-runtime-audit-report-{0}.md" -f $timestamp)

$summary = [pscustomobject]@{
  scanned_file_count = $files.Count
  hit_count          = $results.Count
  generated_at       = (Get-Date).ToString('s')
  results            = $results
}

$summary | ConvertTo-Json -Depth 10 | Set-Content -Path $jsonPath -Encoding UTF8

$md = New-Object System.Collections.Generic.List[string]
$null = $md.Add('# Database Runtime Audit')
$null = $md.Add('')
$null = $md.Add(('Scanned files: {0}' -f $files.Count))
$null = $md.Add('')

if ($results.Count -eq 0) {
  $null = $md.Add('No legacy DB runtime references found.')
} else {
  $null = $md.Add('| table | files | matching lines |')
  $null = $md.Add('|---|---:|---:|')
  foreach ($item in $results) {
    $null = $md.Add(('| {0} | {1} | {2} |' -f $item.table, $item.file_count, $item.unique_match_count))
  }

  foreach ($row in $results) {
    $null = $md.Add('')
    $null = $md.Add(('## {0}' -f $row.table))
    foreach ($file in $row.files) {
      $null = $md.Add(('- {0}' -f $file.file))
      foreach ($match in $file.matches) {
        $null = $md.Add(('  - line {0} | keyword {1} | {2}' -f $match.lineNumber, $match.keyword, $match.line))
      }
    }
  }
}

$md | Set-Content -Path $mdPath -Encoding UTF8

Write-Host ('Scanned files: {0}' -f $files.Count)
if ($results.Count -eq 0) {
  Write-Host 'No legacy DB runtime references found.'
} else {
  foreach ($row in $results) {
    Write-Host ('- {0}: {1} files, {2} matching lines' -f $row.table, $row.file_count, $row.unique_match_count)
  }
}
Write-Host ('Markdown report: {0}' -f $mdPath)
Write-Host ('JSON report:     {0}' -f $jsonPath)

if ($FailOnHits -and $results.Count -gt 0) {
  exit 1
}
