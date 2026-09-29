# Season admin for the shared-world Worker (BRDC-SEASON-002/004).
#
# A menu for Infinite: make the admin key, check the Worker, archive a season, open the
# next one. The key lives in %USERPROFILE%\.es3-admin-key - outside the repo, never
# committed - and every admin call reads it from there. Run it with season-admin.bat.

$ErrorActionPreference = 'Stop'
$Api = 'https://eldritch-world.es3-world-worker.workers.dev'
$KeyFile = Join-Path $env:USERPROFILE '.es3-admin-key'
$Worker = Join-Path $PSScriptRoot '..\apps\worker'

function Get-Key {
  if (-not (Test-Path $KeyFile)) { throw "No admin key yet. Choose 1 first." }
  (Get-Content $KeyFile -Raw).Trim()
}

function Call([string]$Method, [string]$Path, $Body = $null, [switch]$Admin) {
  $headers = @{}
  if ($Admin) { $headers['x-admin-key'] = Get-Key }
  $req = @{ Uri = "$Api$Path"; Method = $Method; Headers = $headers; UseBasicParsing = $true }
  if ($Body -ne $null) { $req.Body = ($Body | ConvertTo-Json -Compress); $req.ContentType = 'application/json' }
  try {
    $r = Invoke-WebRequest @req
    Write-Host "HTTP $($r.StatusCode)" -ForegroundColor Green
    if ($r.Content) { Write-Host $r.Content }
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "HTTP $code - $($_.Exception.Message)" -ForegroundColor Red
  }
}

function New-AdminKey {
  $b = New-Object byte[] 24
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
  $key = ($b | ForEach-Object { $_.ToString('x2') }) -join ''
  Set-Content -Path $KeyFile -Value $key -NoNewline
  Write-Host "Key saved to $KeyFile (outside the repo)." -ForegroundColor Green
  Write-Host "Sending it to Cloudflare as the Worker secret ADMIN_KEY..."
  Push-Location $Worker
  try { $key | npx wrangler secret put ADMIN_KEY } finally { Pop-Location }
  Write-Host "Done. Copy the key to your password manager too:" -ForegroundColor Yellow
  Write-Host $key
}

function Show-Status {
  Write-Host "`n/season"; Call GET '/season'
  Write-Host "`n/season/ruins"; Call GET '/season/ruins'
  Write-Host "`n/season/reckoning"; Call GET '/season/reckoning'
}

function Invoke-Archive([switch]$Wipe) {
  $era = Read-Host 'Era name (Enter = Season 1)'
  if (-not $era) { $era = 'Season 1' }
  if ($Wipe) {
    Write-Host "This writes every realm to the Chronicles and then EMPTIES the shared map." -ForegroundColor Red
    if ((Read-Host 'Type WIPE to go on') -ne 'WIPE') { Write-Host 'Cancelled.'; return }
    Call POST '/season/archive' @{ era = $era; wipe = $true } -Admin
  } else {
    Call POST '/season/archive' @{ era = $era } -Admin
  }
}

function Open-Season {
  $n = Read-Host 'Season number (Enter = 2)'; if (-not $n) { $n = 2 }
  $name = Read-Host 'Name (Enter = The Low Water)'; if (-not $name) { $name = 'The Low Water' }
  $seed = Read-Host "Seed (Enter = s$n-$(Get-Date -Format yyyyMMdd))"; if (-not $seed) { $seed = "s$n-$(Get-Date -Format yyyyMMdd)" }
  $body = @{ n = [int]$n; name = $name; seed = $seed }
  if ((Read-Host 'Doom rises every third dawn? (y/N)') -eq 'y') { $body.doomEveryNDawns = 3 }
  $day = Read-Host 'Reckoning at the latest on day (Enter = none)'
  if ($day) { $body.reckoningByDay = [int]$day }
  Call POST '/season/open' $body -Admin
}

function Set-Phase {
  $phase = Read-Host 'Phase: open / reckoning / sealed / interregnum / next'
  Call POST '/season/phase' @{ phase = $phase } -Admin
}

while ($true) {
  Write-Host "`n=== Eldritch season admin ===" -ForegroundColor Cyan
  Write-Host '1  Make a new admin key (and send it to Cloudflare)'
  Write-Host '2  Deploy the Worker'
  Write-Host '3  Status: season, ruins, Reckoning'
  Write-Host '4  Archive the season to the Chronicles (map kept - try this first)'
  Write-Host '5  Archive AND wipe the map'
  Write-Host '6  Open a season'
  Write-Host '7  Force a phase (reckoning / sealed / ...)'
  Write-Host 'Q  Quit'
  switch ((Read-Host 'Choose').ToUpper()) {
    '1' { New-AdminKey }
    '2' { Push-Location $Worker; try { npx wrangler deploy } finally { Pop-Location } }
    '3' { Show-Status }
    '4' { Invoke-Archive }
    '5' { Invoke-Archive -Wipe }
    '6' { Open-Season }
    '7' { Set-Phase }
    'Q' { return }
    default { Write-Host 'Choose 1-7 or Q.' }
  }
}
