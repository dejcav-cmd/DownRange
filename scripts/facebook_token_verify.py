"""
Verifies the FACEBOOK_PAGE_ACCESS_TOKEN + FACEBOOK_PAGE_ID secrets that were set by
facebook_token_setup.py. Calls debug_token and /me on the Page token, and writes a
non-sensitive summary to docs/facebook-token-check.json via the Contents API.
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
GRAPH_VERSION = "v26.0"

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

dbg = requests.get(
    f"https://graph.facebook.com/{GRAPH_VERSION}/debug_token",
    params={"input_token": PAGE_TOKEN, "access_token": PAGE_TOKEN},
).json()
result["debug_token_data"] = dbg.get("data", {})

me = requests.get(
    f"https://graph.facebook.com/{GRAPH_VERSION}/me",
    params={"fields": "id,name,category,link,fan_count", "access_token": PAGE_TOKEN},
).json()
result["me"] = me

result["page_id_secret"] = PAGE_ID
result["id_matches"] = str(me.get("id")) == str(PAGE_ID)

summary_json = json.dumps(result, indent=2)
status, resp_text = gh_put_file("docs/facebook-token-check.json", summary_json, "chore: facebook token verification result")
print("Contents API PUT status:", status)
print(summary_json)
