#!/usr/bin/env bash
set -e
QUERY='*[_type=="cronRun" && jobId in ["reddit-deals","web-deals","fix-placeholder-images"]] | order(_createdAt desc) [0..8] { jobId, status, details, error, _createdAt }'
ENCODED=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$QUERY")
curl -s -H "Authorization: Bearer ${SANITY_TOKEN}" \
  "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production?query=${ENCODED}" \
  -o /tmp/cron_runs.json
python3 - << 'PYEOF'
import json
with open('/tmp/cron_runs.json') as f:
    data = json.load(f)
runs = data.get('result', [])
print(f"Total cronRun docs: {len(runs)}")
for r in runs:
    print(f"\n  [{r.get('jobId')}]  {r.get('status')}  {r.get('_createdAt','?')[:16]}")
    if r.get('details'):
        print(f"  details: {r['details']}")
    if r.get('error'):
        print(f"  error:   {r['error']}")
PYEOF
