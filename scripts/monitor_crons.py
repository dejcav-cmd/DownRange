
# ── NEWS ARTICLE SANITY QUERY ─────────────────────────────────────────────────
from datetime import timedelta
print()
print("=== NEWS ARTICLE COUNTS ===")
try:
    now = datetime.now(timezone.utc)
    for label, days in [("Last 7 days", 7), ("Last 30 days", 30), ("Last 48h", 2)]:
        since = (now - timedelta(days=days)).isoformat()
        cnt = q(f'count(*[_type=="newsArticle"&&approved==true&&publishedAt>"{since}"])')
        print(f"  {label}: {cnt}")
    total = q('count(*[_type=="newsArticle"&&approved==true&&defined(slug.current)])')
    print(f"  Total approved+slug: {total}")

    # Most recent 5 articles
    recent = q('*[_type=="newsArticle"&&approved==true]|order(publishedAt desc)[0...5]{title,publishedAt,source}')
    print()
    print("  Most recent articles:")
    for a in (recent or []):
        pub = (a.get('publishedAt') or '?')[:16]
        src = (a.get('source') or '?')[:18]
        ttl = (a.get('title') or '?')[:50]
        print(f"    {pub} | {src:<18} | {ttl}")

    # Dedup pool size
    since7 = (now - timedelta(days=7)).isoformat()
    dedup_size = q(f'count(*[_type in ["newsArticle","gunDeal"]&&_createdAt>"{since7}"])')
    print(f"\n  Dedup pool (newsArticle+gunDeal last 7d): {dedup_size}")
except Exception as e:
    print(f"  ERROR: {e}")
