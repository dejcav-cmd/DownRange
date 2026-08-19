"""
Read-only diagnostic. Checks what the Page token can actually DO on the Page
(the 'tasks' field), which can differ from what debug_token's scopes list shows.
Also re-runs debug_token for a fresh snapshot.
"""
import os
import json
import base64
import requests

OWNER = "dejcav-cmd"
REPO = "DownRange"
GH_PAT = os.environ["GH_PAT_ENV"]
PAGE_TOKEN = os.environ["FB_PAGE_TOKEN"]
PAGE_ID = os.environ["FB_PAGE_ID"]
GRAPH_VERSION = "v20.0"  # match the version socialAgent.js actually uses

gh_headers = {"Authorization": f"Bearer {GH_PAT}", "Accept": "application/vnd.github+json"}


def gh_put_file(path, content_str, message):
    url = f"https://api.github.com/repos/{OWNER}/{REPO}/contents/{path}"
    sha = None
    r = requests.get(url, headers=gh_headers)
    if r.status_code == 200:
        sha = r.json().get("sha")
    payload = {
        "message": message,
        "content": base64.b64encode(content_str.encode("utf-8")).decode("utf-8"),
    }
    if sha:
        payload["sha"] = sha
    r2 = requests.put(url, headers=gh_headers, json=payload)
    return r2.status_code, r2.text


result = {}

# 1. What tasks does this token actually hold on the page?
tasks_resp = requests.get(
    f"https://graph.facebook.com/{GRAPH_VERSION}/{PAGE_ID}",
    params={"fields": "id,name,tasks", "access_token": PAGE_TOKEN},
).json()
result["page_tasks"] = tasks_resp

# 2. Fresh debug_token snapshot
dbg = requests.get(
    f"https://graph.facebook.com/{GRAPH_VERSION}/debug_token",
    params={"input_token": PAGE_TOKEN, "access_token": PAGE_TOKEN},
).json()
result["debug_token"] = dbg.get("data", {})

# 3. Who does this token actually belong to (app-level identity check)
app_resp = requests.get(
    f"https://graph.facebook.com/{GRAPH_VERSION}/app",
    params={"access_token": PAGE_TOKEN},
).json()
result["app_identity"] = app_resp

summary_json = json.dumps(result, indent=2)
status, resp_text = gh_put_file("docs/facebook-permissions-diagnostic.json", summary_json, "chore: facebook permissions diagnostic")
print("Contents API PUT status:", status)
print(summary_json)
