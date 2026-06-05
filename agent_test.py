
import requests, json, os
from datetime import datetime, timedelta

T = os.environ["SANITY_TOKEN"]
H = {"Authorization": "Bearer " + T}
BASE = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production"

def q(query):
    return requests.get(BASE, params={"query": query, "returnQuery": "false"}, headers=H, timeout=15).json()["result"]

# Check what articles look like - especially externalUrl and title vs sourceTitle
arts = q('*[_type == "newsArticle"] | order(_createdAt desc)[0...10]{_id, title, sourceTitle, externalUrl, _createdAt, "slug": slug.current}')
out = {"recent_articles": arts}

# Count articles with no externalUrl (these can't be URL-deduped)
no_url = q('count(*[_type == "newsArticle" && !defined(externalUrl)])')
out["no_external_url"] = no_url

# Sample what the dedup actually loads (last 2000, just urls and titles)
dedup_sample = q('*[_type == "newsArticle"] | order(_createdAt desc)[0...5]{"u": externalUrl, "t": title}')
out["dedup_sample"] = dedup_sample

# Check if articles being published are truly new or existing
# Look at articles created in the last hour
since = (datetime.utcnow() - __import__("datetime").timedelta(hours=1)).strftime('%Y-%m-%dT%H:%M:%SZ')
recent = q(f'*[_type == "newsArticle" && _createdAt > "{since}"]{{_id, title, externalUrl, _createdAt, "slug": slug.current}}')
out["created_last_hour"] = recent
out["created_last_hour_count"] = len(recent)

with open("agent_test_results.json", "w") as f:
    json.dump(out, f, indent=2)
print("DONE")
for a in arts[:5]:
    print(f"  {a.get('_createdAt','')[:16]} | url={str(a.get('externalUrl','NONE'))[:50]} | title={a.get('title','')[:40]}")
