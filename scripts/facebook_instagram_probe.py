import os
import json
import requests
import time

TOKEN = os.environ["FB_RAW_TOKEN"]
PAGE_ID = os.environ["FB_PAGE_ID"]
GRAPH_VERSION = "v20.0"

result = {}

# Step 1: get the Instagram Business Account ID linked to the Page
page_ig = requests.get(
    f"https://graph.facebook.com/{GRAPH_VERSION}/{PAGE_ID}",
    params={"fields": "instagram_business_account,name", "access_token": TOKEN},
).json()
result["page_instagram_lookup"] = page_ig

ig_user_id = (page_ig.get("instagram_business_account") or {}).get("id")
if not ig_user_id:
    result["error"] = "Could not resolve instagram_business_account from the Page — stopping here."
    print(json.dumps(result, indent=2))
    exit(0)

result["ig_user_id"] = ig_user_id

# Step 2: confirm the IG account identity matches expected handle
ig_identity = requests.get(
    f"https://graph.facebook.com/{GRAPH_VERSION}/{ig_user_id}",
    params={"fields": "username,name", "access_token": TOKEN},
).json()
result["ig_identity"] = ig_identity

# Step 3: try creating a real media container (does NOT publish yet)
create_resp = requests.post(
    f"https://graph.facebook.com/{GRAPH_VERSION}/{ig_user_id}/media",
    data={
        "image_url": "https://cdn.sanity.io/images/vbnsqnkg/production/e8730ce9ccc0f86511960c4770aa06c3ec5ab3de-1920x1080.jpg",
        "caption": "Test container — not publishing yet.",
        "access_token": TOKEN,
    },
).json()
result["container_create_response"] = create_resp

print(json.dumps(result, indent=2))
