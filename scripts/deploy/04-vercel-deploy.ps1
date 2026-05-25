# STEP 4 — Vercel: deploy + push env vars + connect domain
# Run: .\scripts\deploy\04-vercel-deploy.ps1

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "▶ DownRange — Vercel Deployment" -ForegroundColor Yellow
Write-Host ""

# Load .env.local
if (-not (Test-Path ".env.local")) {
    Write-Host "✗ .env.local not found." -ForegroundColor Red; exit 1
}
$env = @{}
Get-Content ".env.local" | ForEach-Object {
    if ($_ -match "^([^#][^=]+)=(.*)$") {
        $env[$Matches[1].Trim()] = $Matches[2].Trim()
    }
}

# Install Vercel CLI if needed
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Vercel CLI..."
    npm install -g vercel@latest
    Write-Host "✓ Vercel CLI installed" -ForegroundColor Green
}

# Login
Write-Host "Logging into Vercel (browser will open)..."
vercel whoami 2>$null
if ($LASTEXITCODE -ne 0) { vercel login }
Write-Host ""

# Link project
Write-Host "Linking Vercel project..."
vercel link --yes
Write-Host ""

# Push all env vars
Write-Host "Pushing environment variables to Vercel..."
Write-Host ""

foreach ($key in $env.Keys) {
    $val = $env[$key]
    if ($val) {
        # Push to production and preview
        $val | vercel env add $key production --force 2>$null
        $val | vercel env add $key preview    --force 2>$null
        Write-Host "  ✓ $key" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✓ All env vars pushed" -ForegroundColor Green
Write-Host ""

# Deploy
Write-Host "Deploying to production..."
vercel --prod --yes
Write-Host ""
Write-Host "✓ Deployed" -ForegroundColor Green
Write-Host ""

# Domain
Write-Host "── DOMAIN SETUP ────────────────────────────────" -ForegroundColor Yellow
Write-Host "Adding downrangeco.com..."
vercel domains add downrangeco.com 2>$null

Write-Host ""
Write-Host "ACTION REQUIRED — Add these DNS records at your registrar:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Type    Name    Value" -ForegroundColor White
Write-Host "  ─────   ─────   ──────────────────────" -ForegroundColor Gray
Write-Host "  A       @       76.76.21.21" -ForegroundColor Cyan
Write-Host "  CNAME   www     cname.vercel-dns.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "  DNS propagation: usually 5-30 min, up to 24 hrs." -ForegroundColor Gray
Write-Host "  Check: vercel domains inspect downrangeco.com" -ForegroundColor Gray
Write-Host ""
Write-Host "  Also: Upgrade to Vercel Pro in your dashboard" -ForegroundColor Yellow
Write-Host "  Required for cron jobs: https://vercel.com/dashboard → Settings → Billing" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press ENTER when DNS is set and Vercel Pro is active..."
Read-Host ""

Write-Host "Next: .\scripts\deploy\05-algolia-setup.ps1" -ForegroundColor Gray
