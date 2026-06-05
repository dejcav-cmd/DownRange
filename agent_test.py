
import requests, json, os

T = os.environ["SANITY_TOKEN"]
H = {"Authorization": "Bearer " + T}
BASE = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production"

def q(query):
    return requests.get(BASE, params={"query": query, "returnQuery": "false"}, headers=H, timeout=15).json()["result"]

# Check the GOA article specifically
art = q('*[_id == "goa-c7f32d4e8dd10832c66d424782eb9c20"][0]{_id, title, "slug": slug.current, approved, publishedAt, body}')
print("GOA article:")
print(f"  title: {art.get('title','')}")
print(f"  slug: {art.get('slug','')}")
print(f"  approved: {art.get('approved')}")
print(f"  has body: {bool(art.get('body'))}")

# Check the article is fetchable by slug (simulates what the news/[slug] page does)
slug = art.get('slug','')
art2 = q(f'*[_type == "newsArticle" && slug.current == "{slug}"][0]{{_id, title, "slug": slug.current}}')
print(f"\nFetchable by slug '{slug}':", json.dumps(art2))

# Now test the article URL via curl (GitHub Actions has real internet)
import subprocess
result = subprocess.run(
    ['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', 
     f'https://downrangeco.com/news/{slug}'],
    capture_output=True, text=True, timeout=15
)
print(f"\nHTTP status for /news/{slug}: {result.stdout}")

# Also test a known good recent article
recent = q('*[_type == "newsArticle" && approved == true && defined(slug.current)] | order(_createdAt desc)[0...3]{title, "slug": slug.current}')
for a in recent:
    r2 = subprocess.run(
        ['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}',
         f'https://downrangeco.com/news/{a["slug"]}'],
        capture_output=True, text=True, timeout=15
    )
    print(f"HTTP {r2.stdout} — /news/{a['slug'][:50]}")

# Count articles that have NO body (never rewritten)
no_body = q('count(*[_type == "newsArticle" && !defined(body)])')
with_body = q('count(*[_type == "newsArticle" && defined(body) && length(body) > 50])')
print(f"\nArticles with no body: {no_body}")
print(f"Articles with body: {with_body}")

with open("agent_test_results.json", "w") as f:
    json.dump({"goa_article": art, "no_body": no_body, "with_body": with_body}, f, indent=2)
