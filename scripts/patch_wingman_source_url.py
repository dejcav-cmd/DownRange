#!/usr/bin/env python3
"""Patches sourceUrl on the Fierce Firearms Wingman SBR firearmRelease document."""
import os
import json
import urllib.request

SANITY_PROJECT_ID = os.environ.get("NEXT_PUBLIC_SANITY_PROJECT_ID", "vbnsqnkg")
SANITY_DATASET = "production"
SANITY_TOKEN = os.environ.get("SANITY_API_TOKEN", "").strip()
if SANITY_TOKEN.startswith("ST="):
    SANITY_TOKEN = SANITY_TOKEN[3:]

MUTATE_URL = f"https://{SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/mutate/{SANITY_DATASET}"
QUERY_URL = f"https://{SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/{SANITY_DATASET}"

DOC_ID = "release-88c40ff6a52f"
NEW_SOURCE_URL = "https://fiercearms.com/firearm/wingman-sbr/"


def http_post_json(url, payload, token):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def sanity_query(groq, token):
    import urllib.parse
    url = f"{QUERY_URL}?query={urllib.parse.quote(groq)}"
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main():
    result = {"ok": False}
    if not SANITY_TOKEN:
        result["error"] = "SANITY_API_TOKEN not set"
        with open("patch_source_url_result.json", "w") as f:
            json.dump(result, f, indent=2)
        print(json.dumps(result))
        return

    payload = {
        "mutations": [
            {"patch": {"id": DOC_ID, "set": {"sourceUrl": NEW_SOURCE_URL}}}
        ]
    }
    mutate_result = http_post_json(MUTATE_URL, payload, SANITY_TOKEN)
    result["mutate_result"] = mutate_result

    verify = sanity_query(
        '*[_id == "%s"][0]{_id, title, sourceUrl}' % DOC_ID,
        SANITY_TOKEN,
    )
    result["verify"] = verify.get("result")
    result["ok"] = bool(verify.get("result", {}).get("sourceUrl") == NEW_SOURCE_URL)

    with open("patch_source_url_result.json", "w") as f:
        json.dump(result, f, indent=2)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
