import os
import json
import requests

PAGE_TOKEN = os.environ["FB_PAGE_TOKEN"]
GRAPH_VERSION = "v20.0"

accounts = requests.get(
    f"https://graph.facebook.com/{GRAPH_VERSION}/me/accounts",
    params={"access_token": PAGE_TOKEN},
).json()

print(json.dumps(accounts, indent=2))
