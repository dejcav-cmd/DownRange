#!/usr/bin/env python3
import os, json, urllib.request, urllib.parse

SANITY_PROJECT_ID = os.environ.get("NEXT_PUBLIC_SANITY_PROJECT_ID", "vbnsqnkg")
SANITY_TOKEN = os.environ.get("SANITY_API_TOKEN", "").strip()
if SANITY_TOKEN.startswith("ST="):
    SANITY_TOKEN = SANITY_TOKEN[3:]
QUERY_URL = f"https://{SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/production"

def sanity_query(groq, token):
    url = f"{QUERY_URL}?query={urllib.parse.quote(groq)}"
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))

groq = '*[_type == "blogPost" && defined(body)]{_id, title, body, status, editorLocked, category}'
result = sanity_query(groq, SANITY_TOKEN)
docs = result.get("result", [])

fenced = []
for d in docs:
    b = (d.get("body") or "").lstrip()
    if b.startswith("```") or b.startswith("&#96;&#96;&#96;") or "```html" in b[:50] or "```" in b[:20]:
        fenced.append({
            "_id": d["_id"], "title": d.get("title"), "status": d.get("status"),
            "editorLocked": d.get("editorLocked"), "category": d.get("category"),
            "bodyStart": b[:60]
        })

out = {"total_scanned": len(docs), "fenced_count": len(fenced), "fenced": fenced}
with open("diag_fences2_result.json", "w") as f:
    json.dump(out, f, indent=2)
print(json.dumps(out, indent=2)[:5000])
