
import requests, json, os
from datetime import datetime, timedelta

T = os.environ["SANITY_TOKEN"]
H = {"Authorization": "Bearer " + T}
BASE = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production"

def q(query):
    return requests.get(BASE, params={"query": query, "returnQuery": "false"}, headers=H, timeout=15).json()["result"]

since = (datetime.utcnow() - timedelta(days=10)).strftime('%Y-%m-%dT%H:%M:%SZ')
out = {}
out["total"] = q('count(*[_type == "newsArticle" && approved == true])')
out["last_10d_published"] = q(f'count(*[_type == "newsArticle" && approved == true && publishedAt >= "{since}"])')
out["null_publishedAt"] = q('count(*[_type == "newsArticle" && approved == true && !defined(publishedAt)])')
out["visible_on_news_page"] = q(f'count(*[_type == "newsArticle" && approved == true && category != "deals" && publishedAt >= "{since}"])')
out["sample_publishedAt"] = q('*[_type == "newsArticle" && approved == true] | order(_createdAt desc)[0...5]{title, _createdAt, publishedAt}')

with open("agent_test_results.json", "w") as f:
    json.dump(out, f, indent=2)
print("DONE:", json.dumps(out, indent=2))
