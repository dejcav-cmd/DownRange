#!/usr/bin/env python3
"""Ensure all brazilContent docs have active:true"""
import urllib.request, json, urllib.parse, os, time

TOKEN = os.environ.get("SANITY_TOKEN","")
BASE  = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data"

def sq(query):
    url = BASE + "/query/production?query=" + urllib.parse.quote(query)
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())["result"]

def mutate(mutations):
    body = json.dumps({"mutations": mutations}, ensure_ascii=False).encode()
    req = urllib.request.Request(f"{BASE}/mutate/production", data=body, method="POST",
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

docs = sq('*[_type=="brazilContent" && (active!=true || !defined(active))] { _id, type, title }')
print(f"Docs without active:true: {len(docs)}", flush=True)

for d in docs[:100]:
    try:
        mutate([{"patch": {"id": d["_id"], "set": {"active": True}}}])
        print(f"  Patched: {d.get('type','?')} | {d.get('title','')[:50]}", flush=True)
    except Exception as e:
        print(f"  Failed {d['_id']}: {e}", flush=True)
    time.sleep(0.1)

total = sq('count(*[_type=="brazilContent"])')
active_count = sq('count(*[_type=="brazilContent" && active==true])')
artigos = sq('*[_type=="brazilContent" && type=="artigo"] | order(publishedAt desc) [0...10] { title, imageUrl, active }')

print(f"Total: {total} | Active: {active_count}", flush=True)
print(f"Artigos: {len(artigos)}", flush=True)
for a in artigos:
    img = a.get('imageUrl','')
    ok = bool(img and '/img/' not in img)
    print(f"  {'OK' if ok else 'BAD_IMG'} {a.get('title','')[:60]}", flush=True)
print("DONE", flush=True)
