param(
  [string]$JournalsPath = ".\data\journals.json",
  [string]$OutputPath = ".\scratch\crossref-latest.json",
  [string]$FromDate = "2026-01-01",
  [int]$Rows = 5
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path ".\scratch")) {
  New-Item -ItemType Directory -Path ".\scratch" | Out-Null
}

$journals = Get-Content -Encoding UTF8 $JournalsPath | ConvertFrom-Json
$results = @()

foreach ($journal in $journals) {
  if (-not $journal.crossrefEndpoint) {
    continue
  }

  $query = "?filter=type:journal-article,from-pub-date:$FromDate&sort=published&order=desc&rows=$Rows&select=DOI,title,author,published-online,published,container-title,URL,abstract,type,created"
  $uri = "$($journal.crossrefEndpoint)$query"

  Write-Host "Fetching $($journal.shortName)..." -ForegroundColor Cyan
  Start-Sleep -Milliseconds 900
  $response = Invoke-RestMethod -Headers @{ "User-Agent" = "PaperRev prototype; mailto=paperrev@example.com" } -Uri $uri

  foreach ($item in $response.message.items) {
    $results += [PSCustomObject]@{
      journalId = $journal.id
      journal = $journal.name
      doi = $item.DOI
      title = $item.title[0]
      url = $item.URL
      published = $item.published.'date-parts'[0] -join "-"
      authors = @($item.author | ForEach-Object { "$($_.given) $($_.family)".Trim() })
      source = "Crossref"
      summary_status = "raw_metadata"
    }
  }
}

$results | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 $OutputPath
Write-Host "Saved $($results.Count) records to $OutputPath" -ForegroundColor Green
