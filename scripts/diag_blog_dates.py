#!/usr/bin/env python3
"""Diagnostic: inspect blogPost createdAt vs publishedAt to explain pagination ordering."""
import os
import json
import urllib.request
import urllib.parse

SANITY_PROJECT_ID = os.environ.get("NEXT_PUBLIC_SANITY_PROJECT_ID", "vbnsqnkg")
SANITY_DATASET = "production"
SANITY_TOKEN = os.environ.get("SANITY_API_TOKEN", "").strip()
if SANITY_TOKEN.startswith("ST="):
    SANITY_TOKEN = SANITY_TOKEN[3:]

QUERY_URL = f"https://{SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/{SANITY_DATASET}"


def sanity_query(groq, token):
    url = f"{QUERY_URL}?query={urllib.parse.quote(groq)}"
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main():
    groq = (
        '*[_type == "blogPost" && (status == "published" || published == true)] '
        '| order(_createdAt desc) [0...30] '
        '{_id, title, publishedAt, _createdAt, _updatedAt, status, published, featured}'
    )
    result = sanity_query(groq, SANITY_TOKEN)
    with open("blog_diag_result.json", "w") as f:
        json.dump(result, f, indent=2)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
