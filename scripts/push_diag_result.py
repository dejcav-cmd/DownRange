import base64
import json
import os
import sys
import urllib.error
import urllib.request

repo = "dejcav-cmd/DownRange"
path = sys.argv[1] if len(sys.argv) > 1 else "docs/diag_missing_body_result.json"
token = os.environ["GH_PAT"]

with open(path, "rb") as f:
    content = f.read()

api = f"https://api.github.com/repos/{repo}/contents/{path}"
req = urllib.request.Request(api, headers={
    "Authorization": f"Bearer {token}",
    "Accept": "application/vnd.github+json",
})
try:
    with urllib.request.urlopen(req) as resp:
        sha = json.loads(resp.read())["sha"]
except urllib.error.HTTPError:
    sha = None

payload = {
    "message": f"chore: push {path}",
    "content": base64.b64encode(content).decode(),
    "branch": "main",
}
if sha:
    payload["sha"] = sha

req = urllib.request.Request(
    api,
    data=json.dumps(payload).encode(),
    method="PUT",
    headers={
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json",
    },
)
with urllib.request.urlopen(req) as resp:
    print(resp.status)
