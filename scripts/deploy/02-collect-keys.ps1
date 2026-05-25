# STEP 2 — Collect all API keys and write .env.local
# Run: .\scripts\deploy\02-collect-keys.ps1

Write-Host ""
Write-Host "▶ DownRange — API Key Collection" -ForegroundColor Yellow
Write-Host "Press ENTER to skip any key you don't have yet." -ForegroundColor Gray
Write-Host ""

$envLines = [System.Collections.Generic.List[string]]::new()

function Collect {
    param($Label, $VarName, $Link = "", $Required = $false)
    if ($Link) {
        Write-Host "  Get it: $Link" -ForegroundColor Gray
    }
    if ($Required) {
        $prompt = "  $Label"
    } else {
        $prompt = "  $Label (optional)"
    }
    $val = Read-Host $prompt
    if ($val) {
        $script:envLines.Add("$VarName=$val")
        Write-Host "  ✓ saved" -ForegroundColor Green
    } else {
        Write-Host "  — skipped" -ForegroundColor Gray
    }
    Write-Host ""
}

Write-Host "── SANITY ──────────────────────────────────────" -ForegroundColor Yellow
Write-Host "  Create project at: https://sanity.io/manage" -ForegroundColor Gray
Write-Host ""
Collect "Sanity Project ID"  "NEXT_PUBLIC_SANITY_PROJECT_ID" "" $true
Collect "Sanity Write Token" "SANITY_API_TOKEN" "sanity.io/manage → API → Tokens → Add (Editor role)" $true

Write-Host "── CLERK (AUTH) ────────────────────────────────" -ForegroundColor Yellow
Write-Host "  Create app at: https://clerk.com" -ForegroundColor Gray
Write-Host ""
Collect "Clerk Publishable Key" "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" "" $true
Collect "Clerk Secret Key"      "CLERK_SECRET_KEY" "" $true

Write-Host "── RESEND (EMAIL) ──────────────────────────────" -ForegroundColor Yellow
Write-Host "  Create account at: https://resend.com" -ForegroundColor Gray
Write-Host ""
Collect "Resend API Key"     "RESEND_API_KEY" "" $true
Collect "Resend Audience ID" "RESEND_AUDIENCE_ID" "resend.com → Audiences → Create"

Write-Host "── ALGOLIA (SEARCH) ────────────────────────────" -ForegroundColor Yellow
Write-Host "  Create app at: https://algolia.com" -ForegroundColor Gray
Write-Host ""
Collect "Algolia App ID"     "ALGOLIA_APP_ID" "" $true
Collect "Algolia Admin Key"  "ALGOLIA_ADMIN_KEY" "" $true
Collect "Algolia Search Key" "NEXT_PUBLIC_ALGOLIA_SEARCH_KEY" "" $true

Write-Host "── UPSTASH REDIS (CACHE) ───────────────────────" -ForegroundColor Yellow
Write-Host "  Create DB at: https://upstash.com" -ForegroundColor Gray
Write-Host ""
Collect "Upstash Redis URL"   "UPSTASH_REDIS_REST_URL"
Collect "Upstash Redis Token" "UPSTASH_REDIS_REST_TOKEN"

Write-Host "── NEWS FEEDS ──────────────────────────────────" -ForegroundColor Yellow
Collect "NewsAPI Key" "NEWSAPI_KEY" "newsapi.org/register"
Collect "GNews Key"   "GNEWS_KEY"   "gnews.io"

Write-Host "── LEGISLATION ─────────────────────────────────" -ForegroundColor Yellow
Collect "Congress.gov API Key" "CONGRESS_GOV_KEY" "api.congress.gov/sign-up"
Collect "LegiScan API Key"     "LEGISCAN_KEY"     "legiscan.com/legiscan-api"

Write-Host "── FIREARMS DATA ───────────────────────────────" -ForegroundColor Yellow
Collect "GunBroker Dev Key" "GUNBROKER_KEY"   "developer.gunbroker.com"
Collect "GunBroker Token"   "GUNBROKER_TOKEN"
Collect "YouTube API Key"   "YOUTUBE_API_KEY" "console.cloud.google.com → APIs → YouTube Data API v3"

Write-Host "── CLAUDE AI ───────────────────────────────────" -ForegroundColor Yellow
Collect "Anthropic API Key" "ANTHROPIC_API_KEY" "console.anthropic.com" $true

Write-Host "── DISCORD WEBHOOKS ────────────────────────────" -ForegroundColor Yellow
Write-Host "  Server Settings → Integrations → Webhooks" -ForegroundColor Gray
Write-Host ""
Collect "Discord Status Webhook"   "DISCORD_WEBHOOK_URL"
Collect "Discord Errors Webhook"   "DISCORD_ERRORS_WEBHOOK"
Collect "Discord Breaking Webhook" "DISCORD_BREAKING_WEBHOOK"

# Auto-generate security secrets
Write-Host "── SECURITY SECRETS (auto-generated) ──────────" -ForegroundColor Yellow
$CRON_SECRET        = [System.Guid]::NewGuid().ToString("N") + [System.Guid]::NewGuid().ToString("N").Substring(0,8)
$AGENT_SECRET       = [System.Guid]::NewGuid().ToString("N") + [System.Guid]::NewGuid().ToString("N").Substring(0,8)
$REVALIDATE_SECRET  = [System.Guid]::NewGuid().ToString("N") + [System.Guid]::NewGuid().ToString("N").Substring(0,8)
$SANITY_WH_SECRET   = [System.Guid]::NewGuid().ToString("N") + [System.Guid]::NewGuid().ToString("N").Substring(0,8)

$envLines.Add("CRON_SECRET=$CRON_SECRET")
$envLines.Add("AGENT_SECRET=$AGENT_SECRET")
$envLines.Add("REVALIDATE_SECRET=$REVALIDATE_SECRET")
$envLines.Add("SANITY_WEBHOOK_SECRET=$SANITY_WH_SECRET")
Write-Host "  ✓ 4 security secrets generated" -ForegroundColor Green
Write-Host ""

# Add static values
$envLines.Add("NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in")
$envLines.Add("NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up")
$envLines.Add("NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/")
$envLines.Add("NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/")
$envLines.Add("NEXT_PUBLIC_SANITY_DATASET=production")

# Backup existing .env.local
if (Test-Path ".env.local") {
    Copy-Item ".env.local" ".env.local.backup"
    Write-Host "  ✓ backed up existing .env.local" -ForegroundColor Green
}

# Write file
$envLines | Set-Content ".env.local" -Encoding UTF8
Write-Host "✓ .env.local written" -ForegroundColor Green
Write-Host ""
Write-Host "Your generated secrets — save these:" -ForegroundColor Yellow
Write-Host "  CRON_SECRET:           $CRON_SECRET" -ForegroundColor Cyan
Write-Host "  AGENT_SECRET:          $AGENT_SECRET" -ForegroundColor Cyan
Write-Host "  REVALIDATE_SECRET:     $REVALIDATE_SECRET" -ForegroundColor Cyan
Write-Host "  SANITY_WEBHOOK_SECRET: $SANITY_WH_SECRET" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next: .\scripts\deploy\03-sanity-setup.ps1" -ForegroundColor Gray
