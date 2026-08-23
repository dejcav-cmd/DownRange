import os
import json
import requests

SANITY_PROJECT = "vbnsqnkg"
SANITY_DATASET = "production"
TOKEN = os.environ["SANITY_API_TOKEN"].replace("ST=", "").strip()
FB_TOKEN = os.environ["FB_PAGE_TOKEN"]
FB_PAGE_ID = os.environ["FB_PAGE_ID"]

headers = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

query = '*[_type == "socialConfig"][0]{_id, socialLinks}'
r = requests.get(
    f"https://{SANITY_PROJECT}.api.sanity.io/v2024-01-01/data/query/{SANITY_DATASET}",
    params={"query": query},
    headers=headers,
)
print("Current socialLinks doc:")
print(json.dumps(r.json().get("result"), indent=2))

page = requests.get(
    f"https://graph.facebook.com/v20.0/{FB_PAGE_ID}",
    params={"fields": "link,username,name", "access_token": FB_TOKEN},
).json()
print("\nFacebook page public info:")
print(json.dumps(page, indent=2))
