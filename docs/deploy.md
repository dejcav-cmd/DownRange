# DownRange Deployment Guide

## GitHub Push

Remote URL format (token stored in Claude memory — retrieve each session):
```
https://dejcav-cmd:{GITHUB_PAT}@github.com/dejcav-cmd/DownRange.git
```

Commands every session:
```bash
cd /home/claude/DownRange
git config user.email "dj@downrangeco.com"
git config user.name "DJ Cavalcanti"
git remote set-url origin "https://dejcav-cmd:{GITHUB_PAT}@github.com/dejcav-cmd/DownRange.git"
git add -A && git commit -m "description"
git push origin main
```

The GitHub PAT (classic token, repo scope) is stored in Claude memory under
"DOWNRANGE DEPLOY". Claude retrieves it automatically each session.

## Vercel Deployment Check

Vercel auto-deploys on every push to `main`. No manual trigger needed.

Check deployment status via GitHub API:
```
GET https://api.github.com/repos/dejcav-cmd/DownRange/deployments?per_page=3
```

Check live site:
```
curl -s -o /dev/null -w "%{http_code}" https://downrangeco.com/
```
Expected: 200

## Project Info

- **Repo:** github.com/dejcav-cmd/DownRange
- **Vercel project:** down-range-indol
- **Live domain:** downrangeco.com
- **Git author:** DJ Cavalcanti <dj@downrangeco.com>
- **Branch strategy:** commit to main directly, push triggers Vercel deploy
- **Build command:** `npx next build` (must pass before pushing)
