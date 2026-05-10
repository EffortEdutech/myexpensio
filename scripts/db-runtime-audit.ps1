param(
  [switch]$FailOnHits
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

Write-Host '== database runtime audit ==' -ForegroundColor Cyan

$patterns = @(
  'agents',
  'commission_plans',
  'commission_ledger',
  'referral_attributions',
  'referral_visits',
  'v_partner_commission_summary'
)

$runtimeRoots = @('apps', 'packages')
$includeExtensions = @('.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs')
$excludeDirNames = @('.git', 'node_modules', '.next', '.turbo', 'dist', 'build', 'coverage')

function Get-RepoRelativePath {
  param(
    [string]$BasePath,
    [string]$TargetPath
  )

  $base = (Resolve-Path $BasePath).Path.TrimEnd('\','/')
  $target = (Resolve-Path $TargetPath).Path

  if ($target.StartsWith($base, [System.StringComparison]::OrdinalIgnoreCase)) {
    return $target.Substring($base.Length).TrimStart([char[]]@('\','/'))
  }

  return $target
}

function Test-ExcludedPath {
  param([string]$Path)

  $normalized = $Path.Replace('/', '\').ToLowerInvariant()
  foreach ($dir in $excludeDirNames) {
    $needle = '\' + $dir.ToLowerInvariant() + '\'
    if ($normalized.Contains($needle)) {
      return $true
    }
  }
  return $false
}

$files = @()
foreach ($root in $runtimeRoots) {
  $rootPath = Join-Path $repoRoot $root
  if (Test-Path $rootPath) {
    $files += Get-ChildItem -Path $rootPath -Recurse -File |
      Where-Object {
        ($includeExtensions -contains $_.Extension) -and -not (Test-ExcludedPath $_.FullName)
      }
  }
}

$results = @()
foreach ($term in $patterns) {
  $fileHits = @()

  foreach ($file in $files) {
    $matches = Select-String -Path $file.FullName -Pattern $term -SimpleMatch -CaseSensitive:$false -ErrorAction SilentlyContinue
    if (-not $matches) { continue }

    $normalizedMatches = @()
    foreach ($m in $matches) {
      $normalizedMatches += [pscustomobject]@{
        lineNumber = $m.LineNumber
        keyword    = $term
        line       = $m.Line.Trim()
        file       = (Get-RepoRelativePath -BasePath $repoRoot -TargetPath $m.Path)
      }
    }

    $fileHits += [pscustomobject]@{
      file    = (Get-RepoRelativePath -BasePath $repoRoot -TargetPath $file.FullName)
      matches = $normalizedMatches
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
  scope              = 'runtime-code-only'
  scanned_roots      = $runtimeRoots
  scanned_file_count = $files.Count
  hit_count          = $results.Count
  generated_at       = (Get-Date).ToString('s')
  results            = $results
}

$summary | ConvertTo-Json -Depth 10 | Set-Content -Path $jsonPath -Encoding UTF8

$md = New-Object System.Collections.Generic.List[string]
$null = $md.Add('# Database Runtime Audit')
$null = $md.Add('')
$null = $md.Add('Scope: runtime code only (`apps/**`, `packages/**`)')
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

Write-Host ('Scanned runtime files: {0}' -f $files.Count)
if ($results.Count -eq 0) {
  Write-Host 'No legacy DB runtime references found.' -ForegroundColor Green
} else {
  foreach ($row in $results) {
    Write-Host ('- {0}: {1} files, {2} matching lines' -f $row.table, $row.file_count, $row.unique_match_count) -ForegroundColor Yellow
  }
}
Write-Host ('Markdown report: {0}' -f $mdPath)
Write-Host ('JSON report:     {0}' -f $jsonPath)

if ($FailOnHits -and $results.Count -gt 0) {
  exit 1
}
