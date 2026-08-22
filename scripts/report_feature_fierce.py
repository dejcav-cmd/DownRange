#!/usr/bin/env python3
"""Reports the feature-flag patch result back to the repo via the GitHub Contents API."""
import os
import json
import base64
import urllib.request
import urllib.error

REPO = "dejcav-cmd/DownRange"
RESULT_FILE = "feature_fierce_result.json"
GH_TOKEN = os.environ["GH_TOKEN"]

if not os.path.exists(RESULT_FILE):
    log = ""
    if os.path.exists("patch_output.log"):
        with open("patch_output.log") as f:
            log = f.read()
    with open(RESULT_FILE, "w") as f:
        json.dump({"ok": False, "error": "result file not produced", "log": log}, f, indent=2)

with open(RESULT_FILE, "rb") as f:
    content_b64 = base64.b64encode(f.read()).decode("ascii")

api_url = f"https://api.github.com/repos/{REPO}/contents/scripts/{RESULT_FILE}"


def gh_request(url, method="GET", payload=None):
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {GH_TOKEN}")
    req.add_header("Accept", "application/vnd.github+json")
    if data is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))


sha = None
status, body = gh_request(api_url, "GET")
if status == 200:
    sha = body.get("sha")

put_payload = {"message": "chore: feature fierce post result", "content": content_b64}
if sha:
    put_payload["sha"] = sha

status, body = gh_request(api_url, "PUT", put_payload)
print("PUT status:", status)
