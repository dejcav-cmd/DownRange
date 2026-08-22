#!/usr/bin/env python3
import os, re, json, urllib.request, urllib.parse

SANITY_PROJECT_ID = os.environ.get("NEXT_PUBLIC_SANITY_PROJECT_ID", "vbnsqnkg")
SANITY_TOKEN = os.environ.get("SANITY_API_TOKEN", "").strip()
if SANITY_TOKEN.startswith("ST="):
    SANITY_TOKEN = SANITY_TOKEN[3:]
QUERY_URL = f"https://{SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/production"
MUTATE_URL = f"https://{SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/mutate/production"

def sanity_query(groq, token):
    url = f"{QUERY_URL}?query={urllib.parse.quote(groq)}"
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))

def sanity_mutate(mutations, token):
    payload = {"mutations": mutations}
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(f"{MUTATE_URL}?returnDocuments=false", data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))

def strip_cdata(text):
    if not text:
        return text
    cleaned = re.sub(r"<!\[CDATA\[", "", text, flags=re.IGNORECASE)
    cleaned = re.sub(r"\]\]>", "", cleaned)
    return cleaned.strip()

result = {"fixed": [], "errors": [], "screenshot_article": None}

# Find the exact screenshot article via a unique content phrase
exact = sanity_query(
    '*[_type=="newsArticle" && (summary match "*Goggins*" || excerpt match "*Goggins*" || body match "*Goggins*")][0]{_id, title, summary, excerpt, body}',
    SANITY_TOKEN
).get("result")
result["screenshot_article"] = exact

# Bulk fix ALL affected docs
docs = sanity_query(
    '*[_type=="newsArticle" && (summary match "*CDATA*" || excerpt match "*CDATA*" || body match "*CDATA*")]{_id, title, summary, excerpt, body}',
    SANITY_TOKEN
).get("result", [])

mutations = []
for doc in docs:
    patch = {}
    for field in ("summary", "excerpt", "body"):
        val = doc.get(field)
        if val and "CDATA" in val:
            patch[field] = strip_cdata(val)
    if patch:
        mutations.append({"patch": {"id": doc["_id"], "set": patch}})
        result["fixed"].append({"_id": doc["_id"], "title": doc.get("title"), "fields": list(patch.keys())})

# Batch in chunks of 50
for i in range(0, len(mutations), 50):
    batch = mutations[i:i+50]
    try:
        sanity_mutate(batch, SANITY_TOKEN)
    except Exception as e:
        result["errors"].append(str(e))

result["total_docs_found"] = len(docs)
result["total_fixed"] = len(result["fixed"])

with open("fix_all_cdata_result.json", "w") as f:
    json.dump(result, f, indent=2)
print(json.dumps(result, indent=2)[:3000])
