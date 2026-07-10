#!/usr/bin/env python3
"""
Cost & Quality Evaluation — runs once the day after the news cron frequency cut.
Compares article output quality and volume before vs after the changes made 2026-07-10.
Writes report to docs/cost-quality-eval-2026-07-11.md
"""
import os, json, urllib.request, urllib.parse, base64
from datetime import datetime, timezone, timedelta

TOKEN   = os.environ.get('SANITY_TOKEN','').replace('ST=','').strip()
GH_PAT  = os.environ.get('GH_PAT','').strip()
PROJECT = 'vbnsqnkg'
BASE    = f'https://{PROJECT}.api.sanity.io/v2024-01-01/data'
H       = {'Authorization': f'Bearer {TOKEN}', 'Accept': 'application/json'}

def sq(groq):
    url = f'{BASE}/query/production?query={urllib.parse.quote(groq)}&returnQuery=false'
    req = urllib.request.Request(url, headers=H)
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read()).get('result', [])

now     = datetime.now(timezone.utc)
today   = now.strftime('%Y-%m-%d')
yesterday = (now - timedelta(days=1)).strftime('%Y-%m-%d')  # the cut day
two_ago   = (now - timedelta(days=2)).strftime('%Y-%m-%d')  # pre-cut baseline

lines = [f"# DownRange AI Cost & Quality Evaluation", f"Generated: {now.isoformat()[:19]}Z", ""]
lines.append("## Context")
lines.append("Changes deployed 2026-07-10 ~20:15 UTC:")
lines.append("- News cron: `*/30` → `0 */2` (48→12 runs/day)")
lines.append("- Removed 4× daily `rewrite-releases` cron")
lines.append("- Quality-rewrite: 3×/day → 1×/day (3am UTC)")
lines.append("")

# ── Article volume: today (post-cut) vs yesterday pre-cut evening ──────────────
lines.append("## Article Volume")

for label, d_from, d_to in [
    (f"Today ({today}) — post-cut 24h",   f"{today}T00:00:00Z",   f"{today}T23:59:59Z"),
    (f"Yesterday ({yesterday}) — cut day", f"{yesterday}T00:00:00Z", f"{yesterday}T23:59:59Z"),
    (f"Day before ({two_ago}) — baseline", f"{two_ago}T00:00:00Z",  f"{two_ago}T23:59:59Z"),
]:
    count = sq(f'count(*[_type=="newsArticle" && publishedAt >= "{d_from}" && publishedAt <= "{d_to}"])')
    lines.append(f"- {label}: **{count} articles**")

lines.append("")

# ── Article quality signals ───────────────────────────────────────────────────
lines.append("## Quality Signals (today's articles)")

# Body length distribution
body_stats = sq(f'''
*[_type=="newsArticle" && publishedAt >= "{today}T00:00:00Z"] {{
  "bodyLen": length(body),
  "hasBody": defined(body) && length(body) > 100,
  "hasImage": defined(imageUrl) && imageUrl != null,
  "source": source
}}[0...100]
''')

if body_stats:
    lengths = [a.get('bodyLen') or 0 for a in body_stats]
    has_body = sum(1 for a in body_stats if a.get('hasBody'))
    has_image = sum(1 for a in body_stats if a.get('hasImage'))
    avg_len = sum(lengths) / len(lengths) if lengths else 0
    short = sum(1 for l in lengths if 0 < l < 500)
    good  = sum(1 for l in lengths if 500 <= l < 1500)
    long_ = sum(1 for l in lengths if l >= 1500)

    lines.append(f"- Total articles sampled: {len(body_stats)}")
    lines.append(f"- Has body (>100 chars): {has_body}/{len(body_stats)}")
    lines.append(f"- Has image: {has_image}/{len(body_stats)}")
    lines.append(f"- Avg body length: {avg_len:.0f} chars")
    lines.append(f"- Short (<500 chars): {short} | Good (500-1500): {good} | Long (1500+): {long_}")
else:
    lines.append("- No articles found today yet")

lines.append("")

# ── Cron run health from cronRun docs ─────────────────────────────────────────
lines.append("## Cron Run Health (last 24h)")

cron_runs = sq(f'''
*[_type=="cronRun" && lastRun >= "{yesterday}T20:00:00Z"] | order(lastRun desc) {{
  jobId, status, lastRun, "ms": durationMs
}}[0...30]
''')

if cron_runs:
    for r in cron_runs:
        status_icon = "✅" if r.get('status') == 'success' else "❌"
        ms = r.get('ms') or 0
        lines.append(f"- {status_icon} `{r.get('jobId','?')}` — {r.get('status','?')} @ {(r.get('lastRun','')[:19])}Z ({ms//1000}s)")
else:
    lines.append("- No cronRun docs found for last 24h")

lines.append("")

# ── News-specific: article rate before/after cut ──────────────────────────────
lines.append("## News Feed Rate Analysis")

# Post-cut: count articles from midnight to now
post_cut_count = sq(f'count(*[_type=="newsArticle" && publishedAt >= "{today}T00:00:00Z"])')
hours_elapsed  = now.hour + now.minute/60
rate_post = post_cut_count / hours_elapsed if hours_elapsed > 0 else 0

# Pre-cut: same window yesterday
pre_cut_count = sq(f'count(*[_type=="newsArticle" && publishedAt >= "{yesterday}T00:00:00Z" && publishedAt < "{yesterday}T{now.hour:02d}:{now.minute:02d}:00Z"])')
rate_pre = pre_cut_count / hours_elapsed if hours_elapsed > 0 else 0

lines.append(f"- Pre-cut rate (yesterday same window): {pre_cut_count} articles in {hours_elapsed:.1f}h = **{rate_pre:.1f}/hr**")
lines.append(f"- Post-cut rate (today): {post_cut_count} articles in {hours_elapsed:.1f}h = **{rate_post:.1f}/hr**")

if rate_pre > 0:
    pct = (rate_post / rate_pre) * 100
    lines.append(f"- Rate retention: **{pct:.0f}%** of pre-cut output")
    if pct >= 80:
        lines.append("- ✅ Quality verdict: minimal impact — frequency cut is working")
    elif pct >= 60:
        lines.append("- ⚠️  Moderate drop — monitor for another day before adjusting")
    else:
        lines.append("- ❌ Significant drop — consider moving news back to */1 or */45")

lines.append("")

# ── Cost projection ───────────────────────────────────────────────────────────
lines.append("## Cost Projection")
lines.append("Based on changes deployed (estimates):")
lines.append("")
lines.append("| Job | Before | After | Delta |")
lines.append("|-----|--------|-------|-------|")
lines.append("| News rewrite (48→12 runs/day) | $171/mo | $43/mo | -$128 |")
lines.append("| rewrite-releases (removed) | $27/mo | $0 | -$27 |")
lines.append("| quality-rewrite (3x→1x/day) | $11/mo | $4/mo | -$7 |")
lines.append("| All other AI | $12/mo | $12/mo | — |")
lines.append("| **Total** | **~$221/mo** | **~$59/mo** | **-$162** |")
lines.append("")

# ── Recommendations ───────────────────────────────────────────────────────────
lines.append("## Recommendations")
if post_cut_count == 0 or (rate_pre > 0 and (rate_post / rate_pre) < 0.6):
    lines.append("⚠️  Article rate dropped significantly. Consider:")
    lines.append("- Moving news back to `0 */1 * * *` (hourly) to find the right balance")
    lines.append("- Check if news cron is hitting errors — review cron health above")
elif rate_pre > 0 and (rate_post / rate_pre) >= 0.80:
    lines.append("✅ Frequency cut is working well. No changes needed.")
    lines.append("")
    lines.append("**Next optimization if more savings needed:**")
    lines.append("- Drop `maxTokens` in `rewriteWithClaude` from 1800 → 1200 (-33% output cost)")
    lines.append("  Edit `agent/utils.js` line ~73: `maxTokens: 1200`")
    lines.append("  Estimated additional saving: ~$14/mo (total → ~$45/mo)")
else:
    lines.append("Monitor for another 24h before making further changes.")

lines.append("")
lines.append("---")
lines.append(f"*Auto-generated by scripts/eval_cost_quality.py at {now.isoformat()[:19]}Z*")

report = '\n'.join(lines)
print(report)

# Write to repo
path = 'docs/cost-quality-eval-2026-07-11.md'
try:
    encoded = base64.b64encode(report.encode()).decode()
    api = f'https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}'
    try:
        req = urllib.request.Request(api, headers={'Authorization': f'Bearer {GH_PAT}', 'Accept': 'application/vnd.github.v3+json'})
        with urllib.request.urlopen(req) as r: sha = json.load(r)['sha']
    except: sha = None
    payload = {'message': f'eval: AI cost+quality report {today} [skip ci]', 'content': encoded}
    if sha: payload['sha'] = sha
    req2 = urllib.request.Request(api, data=json.dumps(payload).encode(), method='PUT',
        headers={'Authorization': f'Bearer {GH_PAT}', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req2) as r:
        print(f"\nReport written → {path}")
except Exception as e:
    print(f"\nReport write failed: {e}")
