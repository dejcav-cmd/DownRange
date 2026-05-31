#!/usr/bin/env python3
import json, urllib.request, urllib.parse, time, sys, hashlib

TOKEN   = "skbUvbYYIvf0Uwc43kqoHa7MX556BIABP7tNDQjW06yeBHY9ImiPeEjgMs87ZxlUafA5XRt6LXwn8d5Y9JcmDaZN13fvjxt6Tm3QgSAE8LqSvP6oU7zgF3W4dGb3jnjVIuBnZTICBsln2LHqgKjFIAybBohK6JCJWR8qHmP6CMhPVpsiPB79"
PROJECT = "vbnsqnkg"
BASE    = "https://" + PROJECT + ".api.sanity.io/v2024-01-01/data"

def sanity_query(q, params=None):
    url = BASE + "/query/production?query=" + urllib.parse.quote(q)
    if params:
        for k, v in params.items():
            url += "&" + urllib.parse.quote("$" + k) + "=" + urllib.parse.quote(json.dumps(v))
    req = urllib.request.Request(url, headers={"Authorization": "Bearer " + TOKEN})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())["result"]

def sanity_mutate(mutations):
    body = json.dumps({"mutations": mutations}).encode()
    req = urllib.request.Request(BASE + "/mutate/production", data=body, method="POST",
          headers={"Authorization": "Bearer " + TOKEN, "Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

print("Loading templates from scripts/outreach-templates.json", flush=True)
with open("scripts/outreach-templates.json", "r", encoding="utf-8") as f:
    TEMPLATES = json.load(f)
print("Loaded " + str(len(TEMPLATES)) + " templates", flush=True)

print("Testing Sanity connection...", flush=True)
try:
    test = sanity_query('*[_type == "outreachTemplate"][0]._id')
    print("Sanity OK, existing doc: " + str(test)[:60], flush=True)
except Exception as e:
    print("Sanity connection failed: " + str(e), flush=True)
    sys.exit(1)

created = updated = errors = 0

for tmpl in TEMPLATES:
    name = tmpl["name"]
    try:
        existing = sanity_query('*[_type == "outreachTemplate" && name == $n][0]._id', {"n": name})
        doc = {
            "_type": "outreachTemplate",
            "name": name,
            "type": tmpl["type"],
            "subject": tmpl["subject"],
            "previewText": tmpl.get("previewText", ""),
            "body": tmpl["body"],
            "variables": tmpl.get("variables", []),
            "isActive": True,
        }
        if existing:
            sanity_mutate([{"patch": {"id": existing, "set": doc}}])
            updated += 1
            print("  UPDATED: " + name[:60], flush=True)
        else:
            doc_id = "template-" + hashlib.md5(name.encode()).hexdigest()[:16]
            doc["_id"] = doc_id
            sanity_mutate([{"createOrReplace": doc}])
            created += 1
            print("  CREATED: " + name[:60], flush=True)
        time.sleep(0.3)
    except Exception as e:
        errors += 1
        print("  ERROR " + name[:40] + ": " + str(e), flush=True)

print("", flush=True)
print("DONE: " + str(created) + " created, " + str(updated) + " updated, " + str(errors) + " errors", flush=True)
if errors > 0:
    sys.exit(1)
