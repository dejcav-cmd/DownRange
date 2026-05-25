# MASTER DEPLOY — runs all steps in order
# Run from project root: .\scripts\deploy\run-all.ps1

$ScriptsDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Run-Step {
    param($Num, $Name, $Script)
    Write-Host ""
    Write-Host "════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host "  STEP $Num`: $Name" -ForegroundColor Yellow
    Write-Host "════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host ""
    & "$ScriptsDir\$Script"
    Write-Host ""
    Write-Host "✓ Step $Num complete" -ForegroundColor Green
    Write-Host ""
    if ($Num -lt 6) {
        Read-Host "Press ENTER to continue to step $($Num + 1)"
    }
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║     DOWNRANGE — AUTOMATED DEPLOYMENT          ║" -ForegroundColor Yellow
Write-Host "║     Live. Loaded. Lawful.                     ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Yellow
Write-Host ""
Write-Host "This script walks through every step."
Write-Host "Some steps need you to create accounts or paste keys."
Write-Host ""
Read-Host "Ready? Press ENTER to start"

Run-Step 1 "GitHub Push"      "01-github-push.ps1"
Run-Step 2 "Collect API Keys" "02-collect-keys.ps1"
Run-Step 3 "Sanity CMS Setup" "03-sanity-setup.ps1"
Run-Step 4 "Vercel Deploy"    "04-vercel-deploy.ps1"
Run-Step 5 "Algolia Search"   "05-algolia-setup.ps1"

Write-Host "Waiting 60 seconds for deployment to propagate..." -ForegroundColor Gray
Start-Sleep -Seconds 60

Run-Step 6 "Verify Launch"    "06-verify.ps1"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║     DOWNRANGE IS LIVE                         ║" -ForegroundColor Green
Write-Host "║     downrangeco.com                           ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  Studio:  https://downrangeco.com/studio" -ForegroundColor Cyan
Write-Host "  Search:  https://downrangeco.com/search" -ForegroundColor Cyan
Write-Host "  Agent:   npm run agent (runs locally)" -ForegroundColor Cyan
Write-Host ""
