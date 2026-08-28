import os
import json
import requests

SANITY_PROJECT = "vbnsqnkg"
SANITY_DATASET = "production"
TOKEN = os.environ["SANITY_API_TOKEN"].replace("ST=", "").strip()

headers = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

query = '*[_type == "socialPost" && (platform == "facebook" || platform == "instagram")] | order(_createdAt desc)[0...15]{platform, status, articleTitle, error, postUrl, scheduledAt, postedAt, _createdAt}'
r = requests.get(
    f"https://{SANITY_PROJECT}.api.sanity.io/v2024-01-01/data/query/{SANITY_DATASET}",
    params={"query": query},
    headers=headers,
)
print(json.dumps(r.json().get("result"), indent=2))
