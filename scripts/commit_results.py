import base64, json, urllib.request, os

try:
    with open("scripts/logo_fix_results.txt", "rb") as f:
        content = base64.b64encode(f.read()).decode()
except:
    content = base64.b64encode(b"No results file found").decode()

pat = os.environ["GH_PAT"]
fname = "scripts/logo_fix_results.txt"

try:
    req = urllib.request.Request(
        f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{fname}",
        headers={"Authorization": f"Bearer {pat}"}
    )
    with urllib.request.urlopen(req) as r:
        sha = json.loads(r.read()).get("sha", "")
except:
    sha = ""

payload = {"message": "debug: logo fix results", "content": content}
if sha:
    payload["sha"] = sha

req2 = urllib.request.Request(
    f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{fname}",
    data=json.dumps(payload).encode(), method="PUT",
    headers={"Authorization": f"Bearer {pat}", "Content-Type": "application/json"}
)
with urllib.request.urlopen(req2) as r:
    result = json.loads(r.read())
print("Committed:", result.get("commit", {}).get("sha", "")[:12])
