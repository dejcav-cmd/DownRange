"""
Fix HTML entities in article titles stored in Sanity.
Scans all newsArticle, canadaContent, brazilContent, blogPost, gunDeal docs
for titles containing &amp; &#038; &#8211; etc. and patches them.
"""
import urllib.request, urllib.parse, json, os, re, time

SANITY_TOKEN = os.environ.get("SANITY_API_TOKEN", "")
PROJECT = "vbnsqnkg"
API_BASE = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data"

def sanity_query(q):
    url = f"{API_BASE}/query/production?query={urllib.parse.quote(q)}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {SANITY_TOKEN}"})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())["result"]

def sanity_mutate(mutations):
    url = f"{API_BASE}/mutate/production"
    body = json.dumps({"mutations": mutations}).encode()
    req = urllib.request.Request(url, data=body,
          headers={"Authorization": f"Bearer {SANITY_TOKEN}", "Content-Type": "application/json"},
          method="POST")
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

NAMED = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
    '&apos;': "'", '&nbsp;': ' ', '&ndash;': '\u2013', '&mdash;': '\u2014',
    '&lsquo;': '\u2018', '&rsquo;': '\u2019', '&ldquo;': '\u201C', '&rdquo;': '\u201D',
    '&hellip;': '\u2026', '&trade;': '\u2122', '&reg;': '\u00AE', '&copy;': '\u00A9',
}

def decode(s):
    if not s:
        return s
    for ent, ch in NAMED.items():
        s = s.replace(ent, ch)
    s = re.sub(r'&#(\d+);', lambda m: chr(int(m.group(1))), s)
    s = re.sub(r'&#x([0-9a-fA-F]+);', lambda m: chr(int(m.group(1), 16)), s)
    # Second pass for double-encoded &amp;amp; -> & etc.
    for ent, ch in NAMED.items():
        s = s.replace(ent, ch)
    return s.strip()

def has_entity(s):
    return bool(s and ('&#' in s or '&amp;' in s or '&lt;' in s or '&gt;' in s or '&quot;' in s or '&apos;' in s or '&nbsp;' in s or '&ndash;' in s or '&mdash;' in s or '&lsquo;' in s or '&rsquo;' in s or '&ldquo;' in s or '&rdquo;' in s or '&hellip;' in s))

# Query all content types for entity-contaminated titles
# Use a generous limit — we need to catch everything
QUERIES = [
    ('newsArticle',    '*[_type=="newsArticle" && defined(title)] | order(publishedAt desc) [0...2000] {_id, title}'),
    ('canadaContent',  '*[_type=="canadaContent" && defined(title)] [0...500] {_id, title}'),
    ('brazilContent',  '*[_type=="brazilContent" && defined(title)] [0...500] {_id, title}'),
    ('blogPost',       '*[_type=="blogPost" && defined(title)] [0...200] {_id, title}'),
    ('gunDeal',        '*[_type=="gunDeal" && defined(title)] [0...500] {_id, title}'),
]

total_scanned = 0
total_fixed = 0
total_errors = 0
samples = []

print("=== Scanning Sanity for HTML entity titles ===\n")

for type_name, query in QUERIES:
    print(f"Querying {type_name}...")
    docs = sanity_query(query)
    print(f"  {len(docs)} docs fetched")
    total_scanned += len(docs)

    mutations = []
    for doc in docs:
        t = doc.get("title", "")
        if has_entity(t):
            fixed = decode(t)
            if fixed != t:
                mutations.append({
                    "patch": {"id": doc["_id"], "set": {"title": fixed}}
                })
                if len(samples) < 20:
                    samples.append({
                        "type": type_name,
                        "id": doc["_id"],
                        "before": t[:80],
                        "after": fixed[:80]
                    })

    print(f"  {len(mutations)} need fixing")

    # Batch in groups of 100
    for i in range(0, len(mutations), 100):
        batch = mutations[i:i+100]
        try:
            sanity_mutate(batch)
            total_fixed += len(batch)
            print(f"  Patched batch {i//100 + 1}: {len(batch)} docs")
        except Exception as e:
            total_errors += len(batch)
            print(f"  ERROR batch {i//100 + 1}: {e}")
        time.sleep(0.2)

print(f"\n=== DONE ===")
print(f"Scanned: {total_scanned}")
print(f"Fixed:   {total_fixed}")
print(f"Errors:  {total_errors}")
print(f"\nSamples:")
for s in samples:
    print(f"  [{s['type']}] {s['before']}")
    print(f"           → {s['after']}")

result = {
    "scanned": total_scanned,
    "fixed": total_fixed,
    "errors": total_errors,
    "samples": samples
}
with open("scripts/diag-result.txt", "w") as f:
    f.write(json.dumps(result, indent=2))
print("\nResult written to scripts/diag-result.txt")
