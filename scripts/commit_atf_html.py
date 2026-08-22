#!/usr/bin/env python3
import os, json, base64, urllib.request, urllib.error

GH_TOKEN = os.environ["GH_TOKEN"]
REPO = "dejcav-cmd/DownRange"
PATH_IN_REPO = os.environ.get("COMMIT_PATH", "scripts/atf_raw.html")
LOCAL_FILE = os.environ.get("LOCAL_FILE", "atf_raw.html")

with open(LOCAL_FILE, "rb") as f:
    content_b64 = base64.b64encode(f.read()).decode("ascii")

api_url = f"https://api.github.com/repos/{REPO}/contents/{PATH_IN_REPO}"

def gh_request(url, method="GET", payload=None):
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {GH_TOKEN}")
    req.add_header("Accept", "application/vnd.github+json")
    if data is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"raw": body[:2000]}

sha = None
status, body = gh_request(api_url, "GET")
print("GET status:", status)
if status == 200:
    sha = body.get("sha")

put_payload = {"message": "chore: atf raw html snapshot", "content": content_b64}
if sha:
    put_payload["sha"] = sha

status, body = gh_request(api_url, "PUT", put_payload)
print("PUT status:", status)
print("PUT response:", json.dumps(body)[:1000])
