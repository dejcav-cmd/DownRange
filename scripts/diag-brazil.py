#!/usr/bin/env python3
import urllib.request, json, urllib.parse, os

TOKEN = os.environ.get("SANITY_TOKEN","")
BASE  = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data"

def sq(query):
    url = BASE + "/query/production?query=" + urllib.parse.quote(query)
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())["result"]

total = sq('count(*[_type=="brazilContent"])')
print(f"Total brazilContent: {total}", flush=True)

by_type = sq('*[_type=="brazilContent"] { type } | order(type asc)')
counts = {}
for d in by_type:
    t = d.get('type','?')
    counts[t] = counts.get(t,0) + 1
print(f"By type: {counts}", flush=True)

artigos = sq('*[_type=="brazilContent" && type=="artigo"] | order(publishedAt desc) [0...5] { _id, title, imageUrl, active, qualityReviewed }')
print(f"\nArtigos (first 5):")
for a in artigos:
    img = a.get('imageUrl','')
    img_ok = img and '/img/' not in img
    print(f"  active={a.get('active','?')} img={'OK' if img_ok else 'BAD'} {a.get('title','')[:60]}", flush=True)

# Check if active field is set
inactive = sq('count(*[_type=="brazilContent" && active==false])')
no_active = sq('count(*[_type=="brazilContent" && !defined(active)])')
print(f"\nactive=false: {inactive}, active not set: {no_active}", flush=True)
