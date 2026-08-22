#!/usr/bin/env python3
"""
One-time data migration for existing blogPost documents:
1. Normalize `category` to the canonical 8-value set (OPINION, ANALYSIS, LAW,
   TRAINING, MARKET, INDUSTRY, GEAR, BUILDS) so the blog menu chips actually
   match stored data.
2. Strip leading/trailing ```html markdown fences from `body` that leaked in
   from routes that bypassed the shared fence-stripping helper.
"""
import os
import re
import json
import urllib.request
import urllib.parse

SANITY_PROJECT_ID = os.environ.get("NEXT_PUBLIC_SANITY_PROJECT_ID", "vbnsqnkg")
SANITY_DATASET = "production"
SANITY_TOKEN = os.environ.get("SANITY_API_TOKEN", "").strip()
if SANITY_TOKEN.startswith("ST="):
    SANITY_TOKEN = SANITY_TOKEN[3:]

QUERY_URL = f"https://{SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/{SANITY_DATASET}"
MUTATE_URL = f"https://{SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/mutate/{SANITY_DATASET}"

CATEGORY_MAP = {
    "opinion": "OPINION", "OPINION": "OPINION",
    "analysis": "ANALYSIS", "ANALYSIS": "ANALYSIS",
    "law": "LAW", "laws": "LAW", "legal": "LAW", "LAW": "LAW",
    "training": "TRAINING", "TRAINING": "TRAINING",
    "market": "MARKET", "MARKET": "MARKET", "ammunition": "MARKET",
    "industry": "INDUSTRY", "INDUSTRY": "INDUSTRY",
    "gear": "GEAR", "GEAR": "GEAR", "review": "GEAR",
    "builds": "BUILDS", "BUILDS": "BUILDS",
    "carry": "OPINION",
    "home-defense": "TRAINING", "safety": "TRAINING", "beginner": "TRAINING", "maintenance": "TRAINING",
}


def strip_fences(text):
    if not text:
        return text
    cleaned = re.sub(r"^```[a-zA-Z]*\r?\n?", "", text)
    cleaned = re.sub(r"\r?\n?```\s*$", "", cleaned)
    return cleaned.strip()


def sanity_query(groq, token):
    url = f"{QUERY_URL}?query={urllib.parse.quote(groq)}"
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def sanity_mutate(mutations, token):
    payload = {"mutations": mutations}
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(f"{MUTATE_URL}?returnDocuments=false", data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def chunked(seq, size):
    for i in range(0, len(seq), size):
        yield seq[i:i + size]


def main():
    result = {"category_fixed": 0, "fence_fixed": 0, "category_unmapped": [], "errors": []}

    docs = sanity_query(
        '*[_type == "blogPost"]{_id, category, body}',
        SANITY_TOKEN,
    ).get("result", [])

    mutations = []
    for doc in docs:
        doc_id = doc["_id"]
        patch_set = {}

        cat = doc.get("category")
        if cat is not None:
            mapped = CATEGORY_MAP.get(cat)
            if mapped is None:
                result["category_unmapped"].append({"_id": doc_id, "category": cat})
            elif mapped != cat:
                patch_set["category"] = mapped

        body = doc.get("body")
        if body:
            cleaned = strip_fences(body)
            if cleaned != body:
                patch_set["body"] = cleaned

        if patch_set:
            mutations.append({"patch": {"id": doc_id, "set": patch_set}})
            if "category" in patch_set:
                result["category_fixed"] += 1
            if "body" in patch_set:
                result["fence_fixed"] += 1

    # Batch mutations (Sanity caps at ~100/request)
    for batch in chunked(mutations, 50):
        try:
            sanity_mutate(batch, SANITY_TOKEN)
        except Exception as e:
            result["errors"].append(str(e))

    result["total_docs_scanned"] = len(docs)
    result["total_mutations"] = len(mutations)

    with open("blog_migration_result.json", "w") as f:
        json.dump(result, f, indent=2)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
