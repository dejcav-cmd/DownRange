#!/usr/bin/env python3
"""Sets featured: true on the Fierce Wingman SBR blog post."""
import os
import json
import urllib.request
import urllib.parse

SANITY_PROJECT_ID = os.environ.get("NEXT_PUBLIC_SANITY_PROJECT_ID", "vbnsqnkg")
SANITY_DATASET = "production"
SANITY_TOKEN = os.environ.get("SANITY_API_TOKEN", "").strip()
if SANITY_TOKEN.startswith("ST="):
    SANITY_TOKEN = SANITY_TOKEN[3:]

MUTATE_URL = f"https://{SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/mutate/{SANITY_DATASET}"
QUERY_URL = f"https://{SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/{SANITY_DATASET}"

BLOG_ID = "blog-fierce-wingman-sbr-2026"


def http_post_json(url, payload, token):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def sanity_query(groq, token):
    url = f"{QUERY_URL}?query={urllib.parse.quote(groq)}"
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main():
    result = {"ok": False}
    mutate_result = http_post_json(
        MUTATE_URL,
        {"mutations": [{"patch": {"id": BLOG_ID, "set": {"featured": True}}}]},
        SANITY_TOKEN,
    )
    result["mutate_result"] = mutate_result

    verify = sanity_query(f'*[_id == "{BLOG_ID}"][0]{{_id, title, featured}}', SANITY_TOKEN)
    result["verify"] = verify.get("result")
    result["ok"] = bool(verify.get("result", {}).get("featured") is True)

    with open("feature_fierce_result.json", "w") as f:
        json.dump(result, f, indent=2)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
