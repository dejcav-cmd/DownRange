import os
import json
import requests

SANITY_PROJECT = "vbnsqnkg"
SANITY_DATASET = "production"
TOKEN = os.environ["SANITY_API_TOKEN"].replace("ST=", "").strip()

headers = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

query = '*[_type == "newsArticle" && title match "California\'s Final Week*"][0]{title, imageUrl, "slug":slug.current}'
r = requests.get(
    f"https://{SANITY_PROJECT}.api.sanity.io/v2024-01-01/data/query/{SANITY_DATASET}",
    params={"query": query},
    headers=headers,
)
print(json.dumps(r.json().get("result"), indent=2))
