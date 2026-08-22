#!/usr/bin/env python3
import os, json, urllib.request, urllib.parse

SANITY_PROJECT_ID = os.environ.get("NEXT_PUBLIC_SANITY_PROJECT_ID", "vbnsqnkg")
SANITY_TOKEN = os.environ.get("SANITY_API_TOKEN", "").strip()
if SANITY_TOKEN.startswith("ST="):
    SANITY_TOKEN = SANITY_TOKEN[3:]
QUERY_URL = f"https://{SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/production"

def sanity_query(groq, token):
    url = f"{QUERY_URL}?query={urllib.parse.quote(groq)}"
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))

result = {}
result["nfa_snapshots"] = sanity_query(
    '*[_type == "nfaWaitTime"] | order(fetchedAt desc) [0...10] {_id, fetchedAt, reportMonth, sourceUrl, communityNotes, "formCount": count(forms)}',
    SANITY_TOKEN
)
result["cron_runs"] = sanity_query(
    '*[_type == "cronRun" && jobId == "nfa-wait-times"] | order(_createdAt desc) [0...15] {_id, _createdAt, status, ms, error, details}',
    SANITY_TOKEN
)
with open("diag_nfa_result.json", "w") as f:
    json.dump(result, f, indent=2)
print(json.dumps(result, indent=2))
