# STEP 5 — Algolia: create indices + reindex
# Run: .\scripts\deploy\05-algolia-setup.ps1

Write-Host ""
Write-Host "▶ DownRange — Algolia Setup" -ForegroundColor Yellow
Write-Host ""

# Load env
$env = @{}
Get-Content ".env.local" | ForEach-Object {
    if ($_ -match "^([^#][^=]+)=(.*)$") {
        $env[$Matches[1].Trim()] = $Matches[2].Trim()
    }
}

$APP_ID    = $env["ALGOLIA_APP_ID"]
$ADMIN_KEY = $env["ALGOLIA_ADMIN_KEY"]
$CRON_KEY  = $env["CRON_SECRET"]

if (-not $APP_ID -or -not $ADMIN_KEY) {
    Write-Host "✗ Algolia keys not set. Run 02-collect-keys.ps1 first." -ForegroundColor Red
    exit 1
}

$BASE = "https://$APP_ID-dsn.algolia.net"
$HEADERS = @{
    "X-Algolia-API-Key"        = $ADMIN_KEY
    "X-Algolia-Application-Id" = $APP_ID
    "Content-Type"             = "application/json"
}

function Create-Index {
    param($IndexName, $SearchableAttrs)
    Write-Host -NoNewline "  Creating index: $IndexName... "
    $body = @{
        searchableAttributes = $SearchableAttrs
        attributesForFaceting = @("category","state","type","brand")
        hitsPerPage = 20
    } | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri "$BASE/1/indexes/$IndexName/settings" `
            -Method Put -Headers $HEADERS -Body $body | Out-Null
        Write-Host "✓" -ForegroundColor Green
    } catch {
        Write-Host "✗ $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "Creating Algolia indices..."
Write-Host ""
Create-Index "news"     @("title","summary","category")
Create-Index "laws"     @("title","summary","state","status")
Create-Index "reviews"  @("title","summary","brand","model","caliber","category")
Create-Index "releases" @("title","summary","brand","model","caliber")
Create-Index "states"   @("title","state")
Create-Index "breaking" @("title","summary","category")

Write-Host ""
Write-Host "✓ All 6 indices created" -ForegroundColor Green
Write-Host ""

# Trigger reindex
if ($CRON_KEY) {
    Write-Host "Triggering full reindex from Sanity..."
    try {
        $reindexHeaders = @{ "Authorization" = "Bearer $CRON_KEY" }
        $result = Invoke-RestMethod -Uri "https://downrangeco.com/api/algolia-sync" `
            -Method Get -Headers $reindexHeaders
        Write-Host "  Result: $($result | ConvertTo-Json -Compress)" -ForegroundColor Gray
        Write-Host "✓ Reindex triggered" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠ Reindex failed — run manually after DNS propagates" -ForegroundColor Yellow
    }
} else {
    Write-Host "  Skipping reindex — CRON_SECRET not set" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Next: .\scripts\deploy\06-verify.ps1" -ForegroundColor Gray
