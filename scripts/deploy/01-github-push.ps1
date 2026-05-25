# STEP 1 — Push to GitHub
# Run: .\scripts\deploy\01-github-push.ps1

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "▶ DownRange — GitHub Push" -ForegroundColor Yellow
Write-Host ""

# Check git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "✗ git not found." -ForegroundColor Red
    Write-Host "  Install from: https://git-scm.com/download/win" -ForegroundColor Gray
    exit 1
}

$GH_USER = Read-Host "GitHub username"
$GH_REPO = Read-Host "GitHub repo name (e.g. downrange)"
Write-Host ""
Write-Host "Repo will be: https://github.com/$GH_USER/$GH_REPO" -ForegroundColor Yellow
Write-Host ""

# Init git if needed
if (-not (Test-Path ".git")) {
    git init
    Write-Host "✓ git init" -ForegroundColor Green
}

# Create .gitignore
@"
.env.local
.env
node_modules/
.next/
.sanity/
dist/
*.log
.DS_Store
Thumbs.db
"@ | Set-Content .gitignore
Write-Host "✓ .gitignore created" -ForegroundColor Green

# Commit
git add .
git commit -m "feat: DownRange portal — initial commit" 2>$null
if ($LASTEXITCODE -ne 0) {
    git commit --allow-empty -m "feat: DownRange portal — initial commit"
}
Write-Host "✓ committed" -ForegroundColor Green

# Set remote
git remote remove origin 2>$null
git remote add origin "https://github.com/$GH_USER/$GH_REPO.git"
git branch -M main

Write-Host ""
Write-Host "ACTION REQUIRED:" -ForegroundColor Yellow
Write-Host "  1. Open: https://github.com/new" -ForegroundColor Cyan
Write-Host "  2. Create repo named: $GH_REPO" -ForegroundColor Cyan
Write-Host "  3. Set to Private" -ForegroundColor Cyan
Write-Host "  4. Do NOT check 'Initialize this repository'" -ForegroundColor Cyan
Write-Host "  5. Press ENTER here when done" -ForegroundColor Cyan
Read-Host ""

git push -u origin main
Write-Host ""
Write-Host "✓ Code pushed to GitHub" -ForegroundColor Green
Write-Host "  https://github.com/$GH_USER/$GH_REPO" -ForegroundColor Gray
Write-Host ""
Write-Host "Next: .\scripts\deploy\02-collect-keys.ps1" -ForegroundColor Gray
