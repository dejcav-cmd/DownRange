import urllib.request, urllib.parse, json, os, sys

SANITY_PROJECT = "vbnsqnkg"
SANITY_BASE = f"https://{SANITY_PROJECT}.api.sanity.io/v2024-01-01/data/query/production"

# Get token from GH secrets via env in the workflow
token = os.environ.get("SANITY_API_TOKEN", "")
if not token:
    print("ERROR: No SANITY_API_TOKEN")
    sys.exit(1)

def q(query):
    url = f"{SANITY_BASE}?query={urllib.parse.quote(query)}&returnQuery=false"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.load(r).get("result")

print("=== RECENT NEWS ARTICLES (last 10) ===")
articles = q('*[_type=="newsArticle"]|order(publishedAt desc)[0...10]{_id,title,publishedAt,source,approved}')
if articles:
    for a in articles:
        print(f"  {a.get('publishedAt','?')[:16]} | approved={a.get('approved')} | {a.get('source','?')[:20]} | {a.get('title','?')[:60]}")
else:
    print("  NO ARTICLES FOUND")

print()
print("=== ARTICLE COUNTS ===")
total = q('count(*[_type=="newsArticle"])')
approved = q('count(*[_type=="newsArticle"&&approved==true&&defined(slug.current)])')
last30 = q('count(*[_type=="newsArticle"&&approved==true&&publishedAt>="2026-06-08"])')
last48h = q('count(*[_type=="newsArticle"&&approved==true&&publishedAt>="2026-07-06"])')
last24h = q('count(*[_type=="newsArticle"&&approved==true&&publishedAt>="2026-07-07"])')
print(f"  Total: {total}")
print(f"  Approved+slug: {approved}")
print(f"  Last 30 days (2026-06-08+): {last30}")
print(f"  Last 48h (2026-07-06+): {last48h}")
print(f"  Last 24h (2026-07-07+): {last24h}")

print()
print("=== LAST 5 CRON RUNS (news) ===")
runs = q('*[_type=="cronRun"&&jobId=="news"]|order(at desc)[0...5]{at,status,details,error}')
if runs:
    for r in runs:
        print(f"  {r.get('at','?')[:16]} | {r.get('status')} | {str(r.get('details',''))[:100]}")
        if r.get('error'):
            print(f"    ERROR: {r.get('error','')[:120]}")
else:
    print("  NO CRON RUNS FOUND")
