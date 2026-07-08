import urllib.request, urllib.parse, json, os, base64

TOKEN = os.environ.get("SANITY_TOKEN","").replace("ST=","").strip()
GH_PAT = os.environ.get("GH_PAT","").strip()
PROJECT = "vbnsqnkg"

def q(query):
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/production?query=" + \
          urllib.parse.quote(query) + "&returnQuery=false"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read()).get("result")

runs = q('*[_type=="cronRun"&&jobId=="news"]|order(at desc)[0...2]{at,status,ms,details,error}')
out = "=== FULL GATE LOG ===\n"
for r in (runs or []):
    out += f"{r.get('at','?')[:16]} | {r.get('status')} | {int(r.get('ms',0)/1000)}s\n"
    out += f"  DETAILS: {str(r.get('details',''))}\n"
    if r.get('error'):
        out += f"  ERROR: {str(r.get('error'))}\n"
    out += "\n"

print(out)

# Save
encoded = base64.b64encode(out.encode()).decode()
path = "scripts/news-diag-result.txt"
try:
    req = urllib.request.Request(f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
        headers={"Authorization": f"Bearer {GH_PAT}", "Accept": "application/vnd.github.v3+json"})
    with urllib.request.urlopen(req) as r:
        sha = json.load(r)["sha"]
except: sha = None
payload = {"message": "diag: gate log [skip ci]", "content": encoded}
if sha: payload["sha"] = sha
req = urllib.request.Request(f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
    data=json.dumps(payload).encode(), method="PUT",
    headers={"Authorization": f"Bearer {GH_PAT}", "Content-Type": "application/json"})
with urllib.request.urlopen(req) as r:
    print(f"Saved: {r.status}")
