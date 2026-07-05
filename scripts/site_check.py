import urllib.request, urllib.error, json, datetime, os

BASE = "https://www.downrangeco.com"
PAGES = [
    "/",
    "/news",
    "/deals", 
    "/laws",
    "/releases",
    "/ballistics",
    "/ranges",
    "/nfa-tracker",
    "/carry-insurance",
    "/value-estimator",
    "/learn",
    "/video",
    "/state-hub/TX",
    "/canada",
    "/brazil",
    "/ffl-finder",
    "/market",           # should 404
    "/sitemap.xml",
    "/robots.txt",
    "/api/health",
]

HDR = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,*/*',
}

results = {"checked_at": datetime.datetime.utcnow().isoformat(), "pages": {}}

# --- Fetch a real news slug from Sanity to test ---
import urllib.parse
token = os.environ.get('SANITY_API_TOKEN', '')
news_slug = None
try:
    q = '*[_type=="newsArticle"&&approved==true&&defined(slug.current)]|order(publishedAt desc)[0]{"s":slug.current}'
    url_s = f"https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production?query={urllib.parse.quote(q)}"
    req_s = urllib.request.Request(url_s, headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req_s, timeout=10) as r:
        d = json.loads(r.read())
    news_slug = d.get('result', {}).get('s')
    if news_slug:
        PAGES.insert(1, f"/news/{news_slug}")
        print(f"  Testing news slug: /news/{news_slug}", flush=True)
except Exception as e:
    print(f"  Could not fetch news slug from Sanity: {e}", flush=True)

for page in PAGES:
    url = BASE + page
    req = urllib.request.Request(url, headers=HDR)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            body = r.read(2000).decode('utf-8', errors='replace')
            results["pages"][page] = {"status": r.status, "ok": True, "preview": body[:200]}
            print(f"  {r.status}  {page}", flush=True)
    except urllib.error.HTTPError as e:
        results["pages"][page] = {"status": e.code, "ok": e.code < 400}
        print(f"  {e.code}  {page}", flush=True)
    except Exception as ex:
        results["pages"][page] = {"status": 0, "error": str(ex)}
        print(f"  ERR  {page}  {ex}", flush=True)

ok = sum(1 for v in results["pages"].values() if v.get("ok"))
print(f"
{ok}/{len(PAGES)} pages OK", flush=True)

# Highlight the news slug result
if news_slug:
    ns = results["pages"].get(f"/news/{news_slug}", {})
    code = ns.get("status", 0)
    verdict = "PASS" if code == 200 else ("FAIL - still 500" if code == 500 else f"UNEXPECTED {code}")
    print(f"NEWS SLUG TEST: /news/{news_slug} -> {code} [{verdict}]", flush=True)

with open("scripts/site_check_result.json", "w") as f:
    json.dump(results, f, indent=2)
