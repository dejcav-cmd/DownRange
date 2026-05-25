# STEP 3 — Sanity: deploy schemas + seed data
# Run: .\scripts\deploy\03-sanity-setup.ps1

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "▶ DownRange — Sanity Setup" -ForegroundColor Yellow
Write-Host ""

# Load .env.local
if (-not (Test-Path ".env.local")) {
    Write-Host "✗ .env.local not found. Run 02-collect-keys.ps1 first." -ForegroundColor Red
    exit 1
}

$env = @{}
Get-Content ".env.local" | ForEach-Object {
    if ($_ -match "^([^#][^=]+)=(.*)$") {
        $env[$Matches[1].Trim()] = $Matches[2].Trim()
    }
}

$PROJECT_ID = $env["NEXT_PUBLIC_SANITY_PROJECT_ID"]
$SANITY_TOKEN = $env["SANITY_API_TOKEN"]
$SANITY_WH = $env["SANITY_WEBHOOK_SECRET"]
$REVALIDATE = $env["REVALIDATE_SECRET"]

if (-not $PROJECT_ID) {
    Write-Host "✗ NEXT_PUBLIC_SANITY_PROJECT_ID not set in .env.local" -ForegroundColor Red
    exit 1
}

Write-Host "  Project ID: $PROJECT_ID" -ForegroundColor Yellow
Write-Host ""

# Install deps if needed
Write-Host "Installing dependencies..."
npm install --legacy-peer-deps
Write-Host "✓ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Seed states
Write-Host "Seeding 50 state profiles..."
node scripts/seed-states.js
Write-Host "✓ All 50 states seeded" -ForegroundColor Green
Write-Host ""

# Seed ammo
Write-Host "Seeding baseline ammo prices..."
node scripts/seed-ammo.js
Write-Host "✓ Ammo prices seeded" -ForegroundColor Green
Write-Host ""

# Print webhook instructions
Write-Host "── SANITY WEBHOOKS (manual step) ───────────────" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Open: https://sanity.io/manage/project/$PROJECT_ID/api#webhooks" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Add webhook 1:" -ForegroundColor White
Write-Host "    Name:    Algolia Sync" -ForegroundColor Gray
Write-Host "    URL:     https://downrangeco.com/api/algolia-sync" -ForegroundColor Gray
Write-Host "    Trigger: On publish" -ForegroundColor Gray
Write-Host "    Header:  x-sanity-webhook-secret = $SANITY_WH" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Add webhook 2:" -ForegroundColor White
Write-Host "    Name:    ISR Revalidate" -ForegroundColor Gray
Write-Host "    URL:     https://downrangeco.com/api/revalidate" -ForegroundColor Gray
Write-Host "    Trigger: On publish" -ForegroundColor Gray
Write-Host "    Header:  x-revalidate-secret = $REVALIDATE" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press ENTER when webhooks are configured (or skip for now)..."
Read-Host ""

Write-Host "Next: .\scripts\deploy\04-vercel-deploy.ps1" -ForegroundColor Gray
