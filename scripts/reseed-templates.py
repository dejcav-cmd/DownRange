#!/usr/bin/env python3
import json, urllib.request, urllib.parse, time, sys, hashlib, os

TOKEN = os.environ.get("SANITY_TOKEN", "")
if not TOKEN:
    print("ERROR: SANITY_TOKEN not set", flush=True)
    sys.exit(1)

PROJECT = "vbnsqnkg"
BASE    = "https://" + PROJECT + ".api.sanity.io/v2024-01-01/data"

def sanity_query(q, params=None):
    url = BASE + "/query/production?query=" + urllib.parse.quote(q)
    if params:
        for k, v in params.items():
            url += "&" + urllib.parse.quote("$" + k) + "=" + urllib.parse.quote(json.dumps(v))
    req = urllib.request.Request(url, headers={"Authorization": "Bearer " + TOKEN})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())["result"]

def sanity_mutate(mutations):
    body = json.dumps({"mutations": mutations}, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        BASE + "/mutate/production", data=body, method="POST",
        headers={"Authorization": "Bearer " + TOKEN, "Content-Type": "application/json; charset=utf-8"}
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())

# Test connection
print("Testing Sanity connection...", flush=True)
try:
    test = sanity_query('count(*[_type == "outreachTemplate"])')
    print("OK - current template count:", test, flush=True)
except Exception as e:
    print("FAILED:", str(e), flush=True)
    sys.exit(1)

# Load templates
print("Loading templates from JSON...", flush=True)
with open("scripts/outreach-templates.json", "r", encoding="utf-8") as f:
    TEMPLATES = json.load(f)
print("Loaded", len(TEMPLATES), "templates", flush=True)

created = updated = errors = 0

for i, tmpl in enumerate(TEMPLATES):
    name = tmpl["name"]
    print(f"[{i+1}/{len(TEMPLATES)}] Processing: {name[:55]}...", flush=True)
    try:
        existing = sanity_query('*[_type == "outreachTemplate" && name == $n][0]._id', {"n": name})
        doc = {
            "_type":       "outreachTemplate",
            "name":        name,
            "type":        tmpl.get("type", "all"),
            "subject":     tmpl.get("subject", ""),
            "previewText": tmpl.get("previewText", ""),
            "body":        tmpl.get("body", ""),
            "variables":   tmpl.get("variables", []),
            "isActive":    True,
        }
        if existing:
            sanity_mutate([{"patch": {"id": existing, "set": doc}}])
            updated += 1
            print("  -> UPDATED", flush=True)
        else:
            doc_id = "template-" + hashlib.md5(name.encode()).hexdigest()[:16]
            doc["_id"] = doc_id
            sanity_mutate([{"createOrReplace": doc}])
            created += 1
            print("  -> CREATED", flush=True)
        time.sleep(0.5)
    except Exception as e:
        errors += 1
        print("  -> ERROR:", str(e)[:200], flush=True)

print("", flush=True)
print(f"DONE: {created} created, {updated} updated, {errors} errors", flush=True)
if errors > 0:
    sys.exit(1)
