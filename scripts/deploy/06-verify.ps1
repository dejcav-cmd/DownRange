# STEP 6 — Verify everything is live
# Run: .\scripts\deploy\06-verify.ps1

Write-Host ""
Write-Host "▶ DownRange — Launch Verification" -ForegroundColor Yellow
Write-Host ""

$env = @{}
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            $env[$Matches[1].Trim()] = $Matches[2].Trim()
        }
    }
}

$SITE      = "https://downrangeco.com"
$CRON_KEY  = $env["CRON_SECRET"]
$PROJECT   = $env["NEXT_PUBLIC_SANITY_PROJECT_ID"]
$SANITY_T  = $env["SANITY_API_TOKEN"]
$ALG_APP   = $env["ALGOLIA_APP_ID"]
$ALG_KEY   = $env["ALGOLIA_ADMIN_KEY"]

$pass = 0; $fail = 0; $warn = 0

function Check-Page {
    param($Label, $Url)
    Write-Host -NoNewline "  Checking $Label... "
    try {
        $r = Invoke-WebRequest -Uri $Url -Method Head -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        Write-Host "✓ ($($r.StatusCode))" -ForegroundColor Green
        $script:pass++
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if ($code) {
            Write-Host "✗ ($code)" -ForegroundColor Red
            $script:fail++
        } else {
            Write-Host "? (timeout — DNS may still be propagating)" -ForegroundColor Yellow
            $script:warn++
        }
    }
}

function Check-API {
    param($Label, $Url, $Token)
    Write-Host -NoNewline "  Checking $Label... "
    try {
        $headers = @{ "Authorization" = "Bearer $Token" }
        $r = Invoke-WebRequest -Uri $Url -Headers $headers -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        Write-Host "✓ ($($r.StatusCode))" -ForegroundColor Green
        $script:pass++
    } catch {
        Write-Host "✗" -ForegroundColor Red
        $script:fail++
    }
}

Write-Host "── PAGES ───────────────────────────────────────" -ForegroundColor Yellow
Check-Page "Homepage"      "$SITE/"
Check-Page "News"          "$SITE/news"
Check-Page "Laws"          "$SITE/laws"
Check-Page "Reviews"       "$SITE/reviews"
Check-Page "Releases"      "$SITE/releases"
Check-Page "State Hub"     "$SITE/state-hub"
Check-Page "Market Watch"  "$SITE/market"
Check-Page "Video Hub"     "$SITE/video"
Check-Page "Search"        "$SITE/search"
Check-Page "About"         "$SITE/about"
Check-Page "Studio"        "$SITE/studio"
Write-Host ""

Write-Host "── API ROUTES ──────────────────────────────────" -ForegroundColor Yellow
if ($CRON_KEY) {
    Check-API "Agent (news)"   "$SITE/api/agent?feed=news" $CRON_KEY
    Check-API "Newsletter"     "$SITE/api/newsletter"      $CRON_KEY
    Check-API "Algolia Sync"   "$SITE/api/algolia-sync"    $CRON_KEY
}
Write-Host ""

Write-Host "── EXTERNAL SERVICES ───────────────────────────" -ForegroundColor Yellow
if ($PROJECT -and $SANITY_T) {
    Write-Host -NoNewline "  Checking Sanity CMS... "
    try {
        $headers = @{ "Authorization" = "Bearer $SANITY_T" }
        Invoke-RestMethod -Uri "https://$PROJECT.api.sanity.io/v2024-01-01/data/query/production?query=count(*)" `
            -Headers $headers -TimeoutSec 10 | Out-Null
        Write-Host "✓" -ForegroundColor Green; $pass++
    } catch { Write-Host "✗" -ForegroundColor Red; $fail++ }
}

if ($ALG_APP -and $ALG_KEY) {
    Write-Host -NoNewline "  Checking Algolia... "
    try {
        $headers = @{ "X-Algolia-API-Key" = $ALG_KEY; "X-Algolia-Application-Id" = $ALG_APP }
        Invoke-RestMethod -Uri "https://$ALG_APP-dsn.algolia.net/1/indexes" `
            -Headers $headers -TimeoutSec 10 | Out-Null
        Write-Host "✓" -ForegroundColor Green; $pass++
    } catch { Write-Host "✗" -ForegroundColor Red; $fail++ }
}
Write-Host ""

# Summary
Write-Host "────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host "  Passed: $pass  " -NoNewline -ForegroundColor Green
Write-Host "Failed: $fail  " -NoNewline -ForegroundColor Red
Write-Host "Warnings: $warn" -ForegroundColor Yellow
Write-Host ""

if ($fail -eq 0 -and $warn -eq 0) {
    Write-Host "🎯 DownRange is LIVE. All systems go." -ForegroundColor Green
} elseif ($fail -eq 0) {
    Write-Host "⚠ Mostly good — warnings likely DNS propagation. Check again in 30 min." -ForegroundColor Yellow
} else {
    Write-Host "✗ Some checks failed. Review above and re-run after fixing." -ForegroundColor Red
}
Write-Host ""

# Fire first agent run
if ($fail -eq 0 -and $CRON_KEY) {
    Write-Host "Triggering initial news feed..."
    try {
        $headers = @{ "Authorization" = "Bearer $CRON_KEY" }
        $result = Invoke-RestMethod -Uri "$SITE/api/agent?feed=news" -Headers $headers -TimeoutSec 30
        Write-Host "✓ First news feed triggered" -ForegroundColor Green
        Write-Host "  Check Sanity Studio in ~60 seconds for first articles" -ForegroundColor Gray
    } catch {
        Write-Host "  Could not trigger agent — run manually from Vercel dashboard" -ForegroundColor Yellow
    }
}
Write-Host ""
Write-Host "Studio:  $SITE/studio" -ForegroundColor Cyan
Write-Host "Search:  $SITE/search" -ForegroundColor Cyan
