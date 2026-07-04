import urllib.request, urllib.error, json, datetime

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
print(f"\n{ok}/{len(PAGES)} pages OK")

with open("scripts/site_check_result.json", "w") as f:
    json.dump(results, f, indent=2)
print("Done")
