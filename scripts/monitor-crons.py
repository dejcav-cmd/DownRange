#!/usr/bin/env python3
"""Poll Sanity cronRun docs and report what fired, status, errors."""
import urllib.request, urllib.parse, json, os, sys
from datetime import datetime, timezone, timedelta

TOKEN   = os.environ.get("SANITY_TOKEN","").replace("ST=","")
PROJECT = "vbnsqnkg"
SINCE   = os.environ.get("MONITOR_SINCE", "")
MINUTES = int(os.environ.get("MONITOR_MINUTES", "65"))

def q(query, params=None):
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/production?query=" + \
          urllib.parse.quote(query)
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read()).get("result", [])

now  = datetime.now(timezone.utc)
since_dt = datetime.fromisoformat(SINCE) if SINCE else (now - timedelta(minutes=MINUTES))
since_iso = since_dt.isoformat()

print(f"=== Cron Monitor Report ===")
print(f"Window: {since_dt.strftime('%H:%M UTC')} → {now.strftime('%H:%M UTC')}")
print()

docs = q(f'*[_type=="cronRun" && _createdAt > "{since_iso}"] | order(_createdAt asc) {{job,status,ms,details,error,_createdAt}}')

if not docs:
    print("No cronRun docs found in this window.")
    print("(Either no crons fired yet, or cronRun writes are disabled)")
else:
    ok = [d for d in docs if d.get('status') == 'success']
    warn = [d for d in docs if d.get('status') == 'warning']
    failed = [d for d in docs if d.get('status') in ('failed','error')]

    print(f"Total runs: {len(docs)}  ✓ {len(ok)}  ⚠ {len(warn)}  ✗ {len(failed)}")
    print()

    # Group by job
    by_job = {}
    for d in docs:
        j = d.get('job','?')
        by_job.setdefault(j, []).append(d)

    print(f"{'JOB':35s} {'RUNS':>5} {'OK':>4} {'FAIL':>5} {'AVG_MS':>7} LAST_STATUS")
    print("-" * 75)
    for job, runs in sorted(by_job.items(), key=lambda x: x[0]):
        n_ok   = sum(1 for r in runs if r.get('status')=='success')
        n_fail = sum(1 for r in runs if r.get('status') in ('failed','error'))
        avg_ms = int(sum(r.get('ms',0) for r in runs) / len(runs))
        last   = runs[-1]
        last_s = last.get('status','?')
        last_t = last.get('_createdAt','')[:16]
        icon   = '✓' if last_s=='success' else '✗' if last_s in ('failed','error') else '⚠'
        print(f"  {job:33s} {len(runs):5d} {n_ok:4d} {n_fail:5d} {avg_ms:7d}ms {icon} {last_s} @ {last_t[11:]}")

    if failed:
        print()
        print("FAILURES:")
        for d in failed:
            print(f"  ✗ [{d.get('_createdAt','')[:16]}] {d.get('job','?')}")
            print(f"    {(d.get('error','') or d.get('details',''))[:120]}")

    # Sanity quota check
    quota_errors = [d for d in docs if 'quota' in (d.get('error','') or '').lower() or 'plan_limit' in (d.get('error','') or '').lower()]
    print()
    if quota_errors:
        print(f"⚠ SANITY QUOTA ERRORS: {len(quota_errors)}")
        for d in quota_errors:
            print(f"  {d.get('job')} @ {d.get('_createdAt','')[:16]}: {d.get('error','')[:80]}")
    else:
        print("✓ No Sanity quota errors in this window")

    # Quality-rewrite check
    qr_runs = by_job.get('quality-rewrite', [])
    print()
    print(f"quality-rewrite: {len(qr_runs)} run(s) in window")
    for r in qr_runs:
        det = (r.get('details','') or '')[:100]
        print(f"  [{r.get('_createdAt','')[:16]}] {r.get('status')} — {det}")

print()
print(f"Report generated: {now.strftime('%H:%M:%S UTC')}")
