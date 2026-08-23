import os
import json
import requests

SANITY_PROJECT = "vbnsqnkg"
SANITY_DATASET = "production"
TOKEN = os.environ["SANITY_API_TOKEN"].replace("ST=", "").strip()

headers = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

# Fetch current socialConfig doc
query = '*[_type == "socialConfig"][0]{_id, platforms_config_json}'
r = requests.get(
    f"https://{SANITY_PROJECT}.api.sanity.io/v2024-01-01/data/query/{SANITY_DATASET}",
    params={"query": query},
    headers=headers,
)
doc = r.json().get("result")
print("Current doc:", json.dumps(doc, indent=2))

if not doc:
    print("No socialConfig document found — aborting.")
    exit(1)

doc_id = doc["_id"]
try:
    cfg = json.loads(doc.get("platforms_config_json") or "{}")
except Exception:
    cfg = {}

if "facebook" not in cfg:
    cfg["facebook"] = {}
cfg["facebook"]["enabled"] = True

mutation = {
    "mutations": [
        {
            "patch": {
                "id": doc_id,
                "set": {"platforms_config_json": json.dumps(cfg)},
            }
        }
    ]
}

r2 = requests.post(
    f"https://{SANITY_PROJECT}.api.sanity.io/v2024-01-01/data/mutate/{SANITY_DATASET}",
    headers=headers,
    json=mutation,
)
print("Mutation status:", r2.status_code)
print(r2.text)
