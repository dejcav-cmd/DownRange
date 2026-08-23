import os
import json
import requests

SANITY_PROJECT = "vbnsqnkg"
SANITY_DATASET = "production"
TOKEN = os.environ["SANITY_API_TOKEN"].replace("ST=", "").strip()

headers = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

query = '*[_type == "review" && defined(publishedAt) && defined(slug.current)] | order(publishedAt desc)[0...5]{title, category, "slug":slug.current, imageUrl, publishedAt}'
r = requests.get(
    f"https://{SANITY_PROJECT}.api.sanity.io/v2024-01-01/data/query/{SANITY_DATASET}",
    params={"query": query},
    headers=headers,
)
print(json.dumps(r.json().get("result"), indent=2))
