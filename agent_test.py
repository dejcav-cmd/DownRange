
import requests, json, os

T = os.environ["SANITY_TOKEN"]
H = {"Authorization": "Bearer " + T}
BASE = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production"

def q(query):
    return requests.get(BASE, params={"query": query, "returnQuery": "false"}, headers=H, timeout=15).json()["result"]

# Simulate what content-scan now does (order by _createdAt desc, limit 500)
scan_count = q('count(*[_type == "newsArticle" && defined(title)])')
scan_top5 = q('*[_type == "newsArticle" && defined(title)] | order(_createdAt desc)[0...5]{title, _createdAt, publishedAt, "slug": slug.current}')

out = {"scan_total": scan_count, "scan_top5": scan_top5}

# What /news page now shows (30-day window)
from datetime import datetime, timedelta
since30 = (datetime.utcnow() - timedelta(days=30)).strftime('%Y-%m-%dT%H:%M:%SZ')
visible30 = q(f'count(*[_type == "newsArticle" && approved == true && category != "deals" && publishedAt >= "{since30}"])')
out["visible_30d"] = visible30

with open("agent_test_results.json", "w") as f:
    json.dump(out, f, indent=2)

print("Scan total:", scan_count)
print("Visible on /news (30d):", visible30)
print("Top 5 by _createdAt:")
for a in scan_top5:
    print(f"  created={a.get('_createdAt','')[:16]} published={str(a.get('publishedAt',''))[:16]} | {a.get('title','')[:50]}")
