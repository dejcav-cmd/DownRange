import os
import json
import requests

SANITY_PROJECT = "vbnsqnkg"
SANITY_DATASET = "production"
TOKEN = os.environ["SANITY_API_TOKEN"].replace("ST=", "").strip()

headers = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

query = '*[_type == "socialConfig"][0]{_id, socialLinks}'
r = requests.get(
    f"https://{SANITY_PROJECT}.api.sanity.io/v2024-01-01/data/query/{SANITY_DATASET}",
    params={"query": query},
    headers=headers,
)
doc = r.json().get("result")
if not doc:
    print("No socialConfig doc found — aborting.")
    exit(1)

doc_id = doc["_id"]
links = doc.get("socialLinks") or {}
links["facebook"] = "https://www.facebook.com/1142984005570525"
links["instagram"] = "https://www.instagram.com/downrangeconews/"

mutation = {
    "mutations": [
        {"patch": {"id": doc_id, "set": {"socialLinks": links}}}
    ]
}

r2 = requests.post(
    f"https://{SANITY_PROJECT}.api.sanity.io/v2024-01-01/data/mutate/{SANITY_DATASET}",
    headers=headers,
    json=mutation,
)
print("Mutation status:", r2.status_code)
print(r2.text)
print("New links:", json.dumps(links, indent=2))
