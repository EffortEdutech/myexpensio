param(
  [string]$RepoRoot = (Get-Location).Path
)

$ErrorActionPreference = 'Stop'

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$outDir = Join-Path $RepoRoot 'audit-output\db-runtime-audit'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$reportMd = Join-Path $outDir ("db-runtime-audit-report-" + $timestamp + ".md")
$reportJson = Join-Path $outDir ("db-runtime-audit-report-" + $timestamp + ".json")

$candidates = @(
  @{
    table = 'agents'
    keywords = @('agents', 'agent_code', 'commission_plan_id', 'parent_agent_id')
  },
  @{
    table = 'commission_plans'
    keywords = @('commission_plans', 'commission plan', 'commission_plan_id')
  },
  @{
    table = 'commission_ledger'
    keywords = @('commission_ledger', 'ledger_entry_type', 'commission_amount', 'payout_batch_id')
  },
  @{
    table = 'referral_attributions'
    keywords = @('referral_attributions', 'attributed_agent_id', 'referred_user_id', 'referred_org_id')
  },
  @{
    table = 'referral_visits'
    keywords = @('referral_visits', 'visit_source', 'utm_source', 'utm_medium', 'utm_campaign')
  }
)

$includeExtensions = @('.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.sql', '.md')
$excludeDirNames = @('.git', 'node_modules', '.next', 'dist', 'build', 'coverage', '.turbo', 'audit-output')
$excludePathFragments = @(
  '\docs\db-audit\',
  '\docs\refactor\',
  '\audit-output\'
)

function Get-ScanFiles {
  param([string]$Root)

  Get-ChildItem -Path $Root -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object {
      $extOk = $includeExtensions -contains $_.Extension.ToLower()
      if (-not $extOk) { return $false }

      foreach ($dirName in $excludeDirNames) {
        if ($_.FullName -match [regex]::Escape("\" + $dirName + "\")) {
          return $false
        }
      }

      foreach ($fragment in $excludePathFragments) {
        if ($_.FullName -like ("*" + $fragment + "*")) {
          return $false
        }
      }

      return $true
    }
}

$files = Get-ScanFiles -Root $RepoRoot
if (-not $files -or $files.Count -eq 0) {
  throw ("No files found to scan under " + $RepoRoot)
}

$results = @()

foreach ($candidate in $candidates) {
  $table = $candidate.table
  $keywords = $candidate.keywords
  $matches = @()

  foreach ($keyword in $keywords) {
    $hits = Select-String -Path $files.FullName -Pattern $keyword -SimpleMatch -CaseSensitive:$false -ErrorAction SilentlyContinue
    foreach ($hit in $hits) {
      $relativePath = Resolve-Path -LiteralPath $hit.Path | ForEach-Object {
        $_.Path.Substring($RepoRoot.Length).TrimStart('\')
      }

      $matches += [pscustomobject]@{
        table        = $table
        keyword      = $keyword
        relativePath = ($relativePath -replace '\\','/')
        lineNumber   = $hit.LineNumber
        line         = ($hit.Line.Trim())
      }
    }
  }

  $uniqueMatches = $matches | Sort-Object relativePath, lineNumber, keyword -Unique

  $groupedFiles = $uniqueMatches |
    Group-Object relativePath |
    Sort-Object Name |
    ForEach-Object {
      [pscustomobject]@{
        path      = $_.Name
        hit_count = $_.Count
        matches   = $_.Group
      }
    }

  $results += [pscustomobject]@{
    table              = $table
    keyword_count      = $keywords.Count
    unique_match_count = ($uniqueMatches | Measure-Object).Count
    file_count         = ($groupedFiles | Measure-Object).Count
    files              = $groupedFiles
  }
}

$summary = [pscustomobject]@{
  generated_at       = (Get-Date).ToString('s')
  repo_root          = $RepoRoot
  scanned_file_count = $files.Count
  candidates         = $results
}

$summary | ConvertTo-Json -Depth 8 | Set-Content -Path $reportJson -Encoding UTF8

$md = New-Object System.Collections.Generic.List[string]
$null = $md.Add('# Database Runtime Audit Report')
$null = $md.Add('')
$null = $md.Add(("- Generated at: " + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')))
$null = $md.Add(("- Repo root: " + $RepoRoot))
$null = $md.Add(("- Scanned files: " + $files.Count))
$null = $md.Add('')
$null = $md.Add('## Summary')
$null = $md.Add('')
$null = $md.Add('| Table | Matching Files | Matching Lines |')
$null = $md.Add('|---|---:|---:|')

foreach ($item in $results) {
  $null = $md.Add(("| " + $item.table + " | " + $item.file_count + " | " + $item.unique_match_count + " |"))
}

foreach ($item in $results) {
  $null = $md.Add('')
  $null = $md.Add(("## " + $item.table))
  $null = $md.Add('')
  $null = $md.Add(("- Matching files: " + $item.file_count))
  $null = $md.Add(("- Matching lines: " + $item.unique_match_count))
  $null = $md.Add('')

  if ($item.file_count -eq 0) {
    $null = $md.Add('No matches found.')
    continue
  }

  foreach ($file in $item.files) {
    $null = $md.Add(("### " + $file.path))
    $null = $md.Add('')
    foreach ($m in $file.matches) {
      $safeLine = $m.line.Replace('|', '\|')
      $lineText = "- line " + $m.lineNumber + " - keyword [" + $m.keyword + "] - " + $safeLine
      $null = $md.Add($lineText)
    }
    $null = $md.Add('')
  }
}

$null = $md.Add('## Reviewer next steps')
$null = $md.Add('')
$null = $md.Add('1. Separate true runtime refs from comments/docs/history noise.')
$null = $md.Add('2. Check Supabase SQL objects for hidden dependencies.')
$null = $md.Add('3. Mark each table as KEEP_ACTIVE / KEEP_TEMPORARILY / DROP_CANDIDATE / DROP_READY.')
$null = $md.Add('4. Only then draft a migration-only PR.')

($md -join "`r`n") | Set-Content -Path $reportMd -Encoding UTF8

Write-Host "== database runtime audit ==" -ForegroundColor Cyan
Write-Host ("Scanned files: " + $files.Count)
foreach ($item in $results) {
  Write-Host ("- " + $item.table + ": " + $item.file_count + " files, " + $item.unique_match_count + " matching lines")
}
Write-Host ""
Write-Host ("Markdown report: " + $reportMd)
Write-Host ("JSON report:     " + $reportJson)
