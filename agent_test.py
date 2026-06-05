
import requests, json, os

T = os.environ["SANITY_TOKEN"]
P = "vbnsqnkg"
H = {"Authorization": "Bearer " + T}

# Fix social posts that have hash IDs as articleSlug
fix_url = "https://" + P + ".api.sanity.io/v2024-01-01/data/mutate/production"

# The broken article: _id=news-ed2885a86a33802b8759352ff4b98b4a has slug fml19-vs-fmp13-small-thermal-big-upgrade
# Fix any socialPost that has articleSlug = "news-ed2885a86a33802b8759352ff4b98b4a"
q_url = "https://" + P + ".api.sanity.io/v2024-01-01/data/query/production"

# Find bad social posts
bad_posts = requests.get(q_url, params={
    "query": '*[_type == "socialPost" && articleSlug match "news-*" && length(articleSlug) > 30][0...10]{_id, articleSlug, platform}',
    "returnQuery": "false"
}, headers=H).json().get("result", [])

print(f"Found {len(bad_posts)} social posts with hash IDs as slugs")
for p in bad_posts:
    print(f"  {p['_id'][:20]} platform={p.get('platform')} slug={p.get('articleSlug','')[:40]}")

# Check what news page is actually querying 
# Check the news page count
total = requests.get(q_url, params={"query": 'count(*[_type == "newsArticle" && approved == true])', "returnQuery":"false"}, headers=H).json().get("result",0)
print(f"\nApproved articles: {total}")

# Check latest articles as they appear to the frontend  
latest = requests.get(q_url, params={"query": '*[_type == "newsArticle" && approved == true] | order(publishedAt desc)[0...5]{title, publishedAt, "slug": slug.current}', "returnQuery":"false"}, headers=H).json().get("result",[])
print("Latest articles (frontend view):")
for a in latest:
    print(f"  {str(a.get('publishedAt',''))[:16]} | {str(a.get('slug','NO SLUG'))[:30]} | {a.get('title','')[:50]}")
