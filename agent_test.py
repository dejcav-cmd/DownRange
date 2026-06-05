
import requests, json, os, urllib.parse

T = os.environ["SANITY_TOKEN"]
H = {"Authorization": "Bearer " + T}
BASE = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production"

def q(query):
    return requests.get(BASE, params={"query": query, "returnQuery": "false"}, headers=H, timeout=15).json()["result"]

# Check publishedAt vs _createdAt for recent articles
print("=== publishedAt vs _createdAt for last 5 articles ===")
arts = q('*[_type == "newsArticle" && approved == true] | order(_createdAt desc)[0...5]{title, _createdAt, publishedAt, "slug": slug.current}')
for a in arts:
    print(f"  created={a.get('_createdAt','')[:16]} published={str(a.get('publishedAt') or 'NULL')[:16]} | {a.get('title','')[:50]}")

# Count articles with publishedAt in last 10 days
from datetime import datetime, timedelta
since = (datetime.utcnow() - timedelta(days=10)).strftime('%Y-%m-%dT%H:%M:%S')
count_10d = q(f'count(*[_type == "newsArticle" && approved == true && publishedAt >= "{since}"])')
print(f"\nArticles with publishedAt in last 10 days: {count_10d}")

count_null_pub = q('count(*[_type == "newsArticle" && approved == true && !defined(publishedAt)])')
print(f"Articles with NULL publishedAt: {count_null_pub}")

# Check what the news page would show (approved + not deals + publishedAt last 10 days)
count_visible = q(f'count(*[_type == "newsArticle" && approved == true && category != "deals" && publishedAt >= "{since}"])')
print(f"Articles VISIBLE on news page (last 10 days, not deals): {count_visible}")
