#!/usr/bin/env python3
"""Poll Sanity cronRun docs and report what fired, status, errors."""
import urllib.request, urllib.parse, json, os, sys
from datetime import datetime, timezone, timedelta

TOKEN   = os.environ.get("SANITY_TOKEN","").replace("ST=","")
PROJECT = "vbnsqnkg"
SINCE   = os.environ.get("MONITOR_SINCE", "")
MINUTES = int(os.environ.get("MONITOR_MINUTES", "70"))

def q(query):
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/production?query=" + \
          urllib.parse.quote(query)
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read()).get("result", [])

now      = datetime.now(timezone.utc)
since_dt = datetime.fromisoformat(SINCE) if SINCE else (now - timedelta(minutes=MINUTES))
since_iso = since_dt.isoformat()

print(f"=== Cron Monitor Report ===")
print(f"Window: {since_dt.strftime('%H:%M UTC')} → {now.strftime('%H:%M UTC')}")
print()

# Field names from cronReporter.js: jobId, at, status, ms, details, error
docs = q(f'*[_type=="cronRun" && at > "{since_iso}"] | order(at asc) {{jobId,status,ms,details,error,at}}')

if not docs:
    print("No cronRun docs found in window.")
    print("Possible reasons:")
    print("  - No crons have fired yet in this window")
    print("  - cronReporter is failing silently")
    print("  - 'at' field might differ — checking raw sample...")
    sample = q('*[_type=="cronRun"] | order(_createdAt desc) [0...3] {jobId,status,ms,at,_createdAt}')
    if sample:
        print(f"  Latest cronRun docs:")
        for d in sample:
            print(f"    jobId={d.get('jobId')} at={d.get('at',d.get('_createdAt','?'))[:16]} status={d.get('status')}")
    else:
        print("  No cronRun docs found at all!")
else:
    ok     = [d for d in docs if d.get('status') == 'success']
    warn   = [d for d in docs if d.get('status') == 'warning']
    failed = [d for d in docs if d.get('status') in ('failed','error')]

    print(f"Total runs: {len(docs)}  ✓ {len(ok)}  ⚠ {len(warn)}  ✗ {len(failed)}")
    print()

    by_job = {}
    for d in docs:
        j = d.get('jobId','?')
        by_job.setdefault(j, []).append(d)

    print(f"{'JOB':35s} {'RUNS':>5} {'OK':>4} {'FAIL':>5} {'AVG_MS':>7} LAST STATUS")
    print("-" * 75)
    for job, runs in sorted(by_job.items()):
        n_ok   = sum(1 for r in runs if r.get('status')=='success')
        n_fail = sum(1 for r in runs if r.get('status') in ('failed','error'))
        avg_ms = int(sum(r.get('ms',0) for r in runs) / max(len(runs),1))
        last   = runs[-1]
        last_s = last.get('status','?')
        last_t = (last.get('at') or last.get('_createdAt',''))[:16]
        icon   = '✓' if last_s=='success' else '✗' if last_s in ('failed','error') else '⚠'
        print(f"  {job:33s} {len(runs):5d} {n_ok:4d} {n_fail:5d} {avg_ms:7d}ms  {icon} {last_s} @ {last_t[11:]}")

    if failed:
        print()
        print("FAILURES:")
        for d in failed:
            t = (d.get('at') or d.get('_createdAt',''))[:16]
            print(f"  ✗ [{t}] {d.get('jobId','?')}")
            print(f"    {(d.get('error','') or d.get('details',''))[:120]}")

    quota_errors = [d for d in docs if 'quota' in (d.get('error','') or '').lower() or 'plan_limit' in (d.get('error','') or '').lower()]
    print()
    if quota_errors:
        print(f"⚠ SANITY QUOTA ERRORS STILL OCCURRING: {len(quota_errors)}")
        for d in quota_errors:
            print(f"  {d.get('jobId')} @ {d.get('at','')[:16]}: {d.get('error','')[:80]}")
    else:
        print("✓ No Sanity quota errors in window")

    qr_runs = by_job.get('quality-rewrite', [])
    print()
    if qr_runs:
        print(f"quality-rewrite: {len(qr_runs)} run(s)")
        for r in qr_runs:
            det = (r.get('details','') or '')[:100]
            t   = (r.get('at') or '')[:16]
            print(f"  [{t[11:]}] {r.get('status')} — {det}")
    else:
        print("quality-rewrite: no runs yet in window")

print()
print(f"Report generated: {now.strftime('%H:%M:%S UTC')}")

# ── NEWS ARTICLE SANITY QUERY ─────────────────────────────────────────────────
print()
print("=== NEWS ARTICLE COUNTS ===")
try:
    now_ts = datetime.now(timezone.utc)
    for label, days in [("Last 48h", 2), ("Last 7 days", 7), ("Last 30 days", 30)]:
        since = (now_ts - timedelta(days=days)).isoformat()
        cnt = q(f'count(*[_type=="newsArticle"&&approved==true&&publishedAt>"{since}"])')
        print(f"  {label}: {cnt}")
    total = q('count(*[_type=="newsArticle"&&approved==true&&defined(slug.current)])')
    print(f"  Total approved+slug: {total}")
    recent = q('*[_type=="newsArticle"&&approved==true]|order(publishedAt desc)[0...5]{title,publishedAt,source}')
    print()
    print("  Most recent articles:")
    for a in (recent or []):
        pub = (a.get('publishedAt') or '?')[:16]
        src = (a.get('source') or '?')[:18]
        ttl = (a.get('title') or '?')[:55]
        print(f"    {pub} | {src:<18} | {ttl}")
    since7 = (now_ts - timedelta(days=7)).isoformat()
    dedup_size = q(f'count(*[_type in ["newsArticle","gunDeal"]&&_createdAt>"{since7}"])')
    print(f"\n  Dedup pool (newsArticle+gunDeal 7d): {dedup_size}")
except Exception as e:
    print(f"  ERROR: {e}")

print()
print("=== DEDUP POOL BREAKDOWN ===")
try:
    from datetime import timedelta
    now_ts = datetime.now(timezone.utc)
    since48 = (now_ts - timedelta(hours=48)).isoformat()
    news48  = q(f'count(*[_type=="newsArticle"&&_createdAt>"{since48}"])')
    deals48 = q(f'count(*[_type=="gunDeal"&&_createdAt>"{since48}"])')
    print(f"  newsArticle in last 48h: {news48}")
    print(f"  gunDeal in last 48h:     {deals48}")
    print(f"  Total dedup pool (48h):  {int(news48 or 0) + int(deals48 or 0)}")
except Exception as e:
    print(f"  ERROR: {e}")
