#!/usr/bin/env python3
import os, json, re, urllib.request, urllib.parse

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

PT_WORDS = set("que nao não para com uma das dos mais voce você isso ser tem foi como pelo pela sao são muito sobre este esta seu sua ainda depois antes onde quando".split())
EN_WORDS = set("the and that this with from have been were was does not for you your are was they their there where when about after before".split())

def lang_score(text):
    words = re.findall(r"[a-zA-Zà-úÀ-Ú]+", (text or "").lower())
    pt = sum(1 for w in words if w in PT_WORDS)
    en = sum(1 for w in words if w in EN_WORDS)
    return pt, en, len(words)

groq = '*[_type == "brazilContent"]{_id, title, slug, body, active, publishedAt, source} | order(publishedAt desc)'
result = sanity_query(groq, SANITY_TOKEN)
docs = result.get("result", [])

flagged = []
for d in docs:
    pt, en, total = lang_score(d.get("body", "") + " " + (d.get("title") or ""))
    if total > 20 and en > pt:
        flagged.append({
            "_id": d["_id"], "title": d.get("title"), "slug": (d.get("slug") or {}).get("current"),
            "pt_hits": pt, "en_hits": en, "active": d.get("active"), "source": d.get("source"),
        })

out = {"total_docs": len(docs), "flagged_english": flagged, "flagged_count": len(flagged)}
with open("diag_brazil_lang_result.json", "w") as f:
    json.dump(out, f, indent=2)
print(json.dumps(out, indent=2))
