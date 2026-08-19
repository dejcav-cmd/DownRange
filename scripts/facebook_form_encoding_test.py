"""
Tests whether the /feed publish failure is caused by JSON-body vs form-encoded POST.
Posts a short, clearly-labeled test message using form-encoded data (the Graph API's
expected format). If it succeeds, immediately deletes the test post to keep the Page clean.
"""
import os
import json
import requests

PAGE_TOKEN = os.environ["FB_PAGE_TOKEN"]
PAGE_ID = os.environ["FB_PAGE_ID"]
GRAPH_VERSION = "v20.0"

result = {}

# Test the /photos endpoint specifically, since that's the branch actually failing in prod
post_resp = requests.post(
    f"https://graph.facebook.com/{GRAPH_VERSION}/{PAGE_ID}/photos",
    data={
        "url": "https://cdn.sanity.io/images/vbnsqnkg/production/e8730ce9ccc0f86511960c4770aa06c3ec5ab3de-1920x1080.jpg",
        "caption": "Testing our automated posting system — please disregard, will be removed shortly.",
        "access_token": PAGE_TOKEN,
    },
).json()
result["post_response"] = post_resp

if post_resp.get("id"):
    post_id = post_resp["id"]
    result["success"] = True
    result["post_id"] = post_id
    # Clean up immediately
    del_resp = requests.delete(
        f"https://graph.facebook.com/{GRAPH_VERSION}/{post_id}",
        params={"access_token": PAGE_TOKEN},
    ).json()
    result["delete_response"] = del_resp
else:
    result["success"] = False

print(json.dumps(result, indent=2))
