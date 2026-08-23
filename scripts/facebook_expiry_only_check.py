import os
import json
import requests
import datetime

TOKEN = os.environ["FB_RAW_TOKEN"]
GRAPH_VERSION = "v20.0"

dbg = requests.get(
    f"https://graph.facebook.com/{GRAPH_VERSION}/debug_token",
    params={"input_token": TOKEN, "access_token": TOKEN},
).json()

data = dbg.get("data", {})
expires_at = data.get("expires_at")
result = {
    "type": data.get("type"),
    "is_valid": data.get("is_valid"),
    "scopes": data.get("scopes"),
    "profile_id": data.get("profile_id"),
    "expires_at_raw": expires_at,
    "expires_at_readable": "NEVER (0)" if expires_at == 0 else (
        datetime.datetime.utcfromtimestamp(expires_at).strftime('%Y-%m-%d %H:%M UTC') if expires_at else "not present"
    ),
}

me = requests.get(
    f"https://graph.facebook.com/{GRAPH_VERSION}/me",
    params={"fields": "id,name", "access_token": TOKEN},
).json()
result["me_identity"] = me

print(json.dumps(result, indent=2))
