import json, base64, urllib.request, os

pat = os.environ.get('GH_PAT','')
if not pat:
    print("No GH_PAT — skipping")
    import sys; sys.exit(0)

with open('/tmp/diag_result.json') as f:
    content = f.read()

repo = "dejcav-cmd/DownRange"
path = "scripts/amazon-diag-result.txt"

# Get SHA of existing file
req = urllib.request.Request(
    f"https://api.github.com/repos/{repo}/contents/{path}",
    headers={"Authorization": f"token {pat}", "Accept": "application/vnd.github.v3+json"}
)
sha = ''
try:
    with urllib.request.urlopen(req) as resp:
        sha = json.loads(resp.read()).get('sha','')
except: pass

payload = {
    "message": "chore: amazon diag result [skip ci]",
    "content": base64.b64encode(content.encode()).decode(),
    "committer": {"name": "DJ Cavalcanti", "email": "dj@downrangeco.com"}
}
if sha:
    payload["sha"] = sha

req2 = urllib.request.Request(
    f"https://api.github.com/repos/{repo}/contents/{path}",
    method="PUT", data=json.dumps(payload).encode(),
    headers={"Authorization": f"token {pat}", "Content-Type": "application/json",
             "Accept": "application/vnd.github.v3+json"}
)
try:
    with urllib.request.urlopen(req2) as resp:
        print("Written to repo OK")
except Exception as e:
    print(f"Write failed: {e}")
