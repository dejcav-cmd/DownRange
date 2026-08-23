import os
import json
import requests

PAGE_TOKEN = os.environ["FB_PAGE_TOKEN"]
PAGE_ID = os.environ["FB_PAGE_ID"]
GRAPH_VERSION = "v20.0"

accounts = requests.get(
    f"https://graph.facebook.com/{GRAPH_VERSION}/me/accounts",
    params={"access_token": PAGE_TOKEN},
).json()
print(json.dumps(accounts, indent=2))

# Also try the direct page-token derivation path for system users
page_direct = requests.get(
    f"https://graph.facebook.com/{GRAPH_VERSION}/{PAGE_ID}",
    params={"fields": "access_token,name,id", "access_token": PAGE_TOKEN},
).json()
print("--- direct page access_token field ---")
print(json.dumps(page_direct, indent=2))
