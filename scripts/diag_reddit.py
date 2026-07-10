#!/usr/bin/env python3
"""Minimal diagnostic — print all env, test Sanity, test Reddit, write log."""
import os, json, urllib.request, urllib.parse, base64, traceback

# Show env
SANITY_TOKEN = os.environ.get('SANITY_TOKEN', '').replace('ST=', '').strip()
GH_PAT       = os.environ.get('GH_PAT', '').strip()

lines = []
lines.append(f"SANITY_TOKEN: len={len(SANITY_TOKEN)} prefix={SANITY_TOKEN[:8]!r}")
lines.append(f"GH_PAT: len={len(GH_PAT)} prefix={GH_PAT[:6]!r}")

# Test Sanity
PROJECT = 'vbnsqnkg'
try:
    url = f'https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/production?query=*%5B_type%3D%3D%22gunDeal%22%5D%5B0%5D._id&returnQuery=false'
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {SANITY_TOKEN}'})
    with urllib.request.urlopen(req, timeout=10) as r:
        data = json.loads(r.read())
    lines.append(f"Sanity: OK — result={data.get('result')!r}")
except Exception as e:
    lines.append(f"Sanity: FAIL — {type(e).__name__}: {e}")
    lines.append(traceback.format_exc())

# Test Reddit RSS
try:
    req = urllib.request.Request(
        'https://www.reddit.com/r/gundeals/hot.rss?limit=5',
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    )
    with urllib.request.urlopen(req, timeout=15) as r:
        raw = r.read()
    lines.append(f"Reddit RSS: OK — {len(raw)} bytes")
except Exception as e:
    lines.append(f"Reddit RSS: FAIL — {type(e).__name__}: {e}")

output = '\n'.join(lines)
print(output)

# Write to repo via GitHub API
try:
    encoded = base64.b64encode(output.encode()).decode()
    api = 'https://api.github.com/repos/dejcav-cmd/DownRange/contents/scripts/diag-result.txt'
    try:
        req = urllib.request.Request(api, headers={'Authorization': f'Bearer {GH_PAT}', 'Accept': 'application/vnd.github.v3+json'})
        with urllib.request.urlopen(req) as r:
            sha = json.load(r)['sha']
    except: sha = None
    payload = {'message': 'diag: reddit-deals diagnostic [skip ci]', 'content': encoded}
    if sha: payload['sha'] = sha
    req2 = urllib.request.Request(api, data=json.dumps(payload).encode(), method='PUT',
        headers={'Authorization': f'Bearer {GH_PAT}', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req2) as r:
        print("Log written to repo OK")
except Exception as e:
    print(f"Log write failed: {e}")
