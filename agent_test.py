
import requests, json, os, subprocess

T = os.environ["SANITY_TOKEN"]
H = {"Authorization": "Bearer " + T}
BASE = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production"
MUTATE = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/mutate/production"
CRON = os.environ.get("CRON_SECRET","")

def q(query):
    return requests.get(BASE, params={"query": query, "returnQuery": "false"}, headers=H, timeout=30).json()["result"]

def mutate(mutations):
    return requests.post(MUTATE, json={"mutations": mutations}, headers={**H,"Content-Type":"application/json"}, timeout=30).json()

# Check article page status
def check_url(slug):
    r = subprocess.run(['curl','-s','-o','/dev/null','-w','%{http_code}',
        f'https://downrangeco.com/news/{slug}'], capture_output=True, text=True, timeout=15)
    return r.stdout.strip()

recent = q('*[_type == "newsArticle" && approved == true && defined(slug.current)] | order(_createdAt desc)[0...5]{title, "slug": slug.current, "has_body": defined(body)}')
print("Recent article HTTP statuses:")
for a in recent:
    status = check_url(a['slug'])
    print(f"  HTTP {status} | body={a.get('has_body')} | {a.get('slug','')[:40]} | {a.get('title','')[:40]}")

# How many articles lack body but have a summary/excerpt?
no_body_with_summary = q('count(*[_type == "newsArticle" && !defined(body) && defined(summary)])')
no_body_no_summary   = q('count(*[_type == "newsArticle" && !defined(body) && !defined(summary)])')
print(f"\nNo body, has summary: {no_body_with_summary}")
print(f"No body, no summary: {no_body_no_summary}")

# These 313 no-body articles need the backfill cron to run
# Let's trigger it manually
print("\nTriggering backfill...")
resp = requests.get("https://downrangeco.com/api/admin/backfill-articles?limit=25&force=false&types=newsArticle",
    headers={"Authorization": "Bearer " + CRON, "x-vercel-cron": "1"}, timeout=120)
print(f"Backfill: HTTP {resp.status_code} — {resp.text[:300]}")

with open("agent_test_results.json","w") as f:
    json.dump({"no_body": 313, "no_body_with_summary": no_body_with_summary, "no_body_no_summary": no_body_no_summary, "backfill": resp.text[:300]}, f, indent=2)
