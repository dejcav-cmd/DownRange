import urllib.request, urllib.parse, json, os, base64

TOKEN = os.environ.get("SANITY_API_TOKEN","").replace("ST=","").strip()
GH_PAT = os.environ.get("GH_PAT","").strip()
PROJECT = "vbnsqnkg"

def q(query):
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/production?query={urllib.parse.quote(query)}&returnQuery=false"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read()).get("result")

def save(content):
    encoded = base64.b64encode(content.encode()).decode()
    path = "scripts/news-diag-result.txt"
    try:
        req = urllib.request.Request(f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
            headers={"Authorization": f"Bearer {GH_PAT}", "Accept": "application/vnd.github.v3+json"})
        with urllib.request.urlopen(req) as r: sha = json.load(r)["sha"]
    except: sha = None
    payload = {"message": "diag: deal image count [skip ci]", "content": encoded}
    if sha: payload["sha"] = sha
    req = urllib.request.Request(f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
        data=json.dumps(payload).encode(), method="PUT",
        headers={"Authorization": f"Bearer {GH_PAT}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r: return r.status

missing = q('count(*[_type=="gunDeal" && approved==true && (!defined(imageUrl) || imageUrl == "" || imageUrl == null)])')
total   = q('count(*[_type=="gunDeal" && approved==true])')
with_img = q('count(*[_type=="gunDeal" && approved==true && defined(imageUrl) && imageUrl != "" && imageUrl != null])')

result = f"Deal images after backfill:\n  Total deals: {total}\n  With images: {with_img}\n  Missing: {missing}\n  Coverage: {round(int(with_img or 0)/max(int(total or 1),1)*100)}%\n"
print(result)
save(result)
