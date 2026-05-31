#!/usr/bin/env python3
import json, urllib.request, urllib.parse, os

TOKEN = os.environ.get("SANITY_TOKEN","")
PROJECT = "vbnsqnkg"
BASE = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data"

def sanity_query(q, params=None):
    url = BASE + "/query/production?query=" + urllib.parse.quote(q)
    if params:
        for k, v in params.items():
            url += "&" + urllib.parse.quote("$" + k) + "=" + urllib.parse.quote(json.dumps(v))
    req = urllib.request.Request(url, headers={"Authorization": "Bearer " + TOKEN})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())["result"]

# Find the specific article
slug = "country-made-guns-seized-in-belagavi-district-13-arrested"
article = sanity_query(
    '*[_type == "newsArticle" && slug.current == $s][0] { _id, title, source, externalUrl, imageUrl, _createdAt }',
    {"s": slug}
)

if article:
    print(f"Title:       {article.get('title', '')}")
    print(f"Source:      {article.get('source', 'UNKNOWN')}")
    print(f"External URL:{article.get('externalUrl', '')}")
    print(f"Image URL:   {article.get('imageUrl', '')}")
    print(f"Created:     {article.get('_createdAt', '')}")
else:
    print("Article not found by slug — trying title search")
    results = sanity_query(
        '*[_type == "newsArticle" && title match $t] { _id, title, source, externalUrl, _createdAt }',
        {"t": "*Belagavi*"}
    )
    for r in results[:3]:
        print(f"  {r.get('source','?')} | {r.get('title','')[:60]} | {r.get('externalUrl','')[:80]}")
