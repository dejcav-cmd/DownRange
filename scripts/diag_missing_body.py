import json
import os
import urllib.parse
import urllib.request

SANITY_URL = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production"


def sanity_query(q):
    url = SANITY_URL + "?" + urllib.parse.urlencode({"query": q})
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())["result"]


out = {}

# Top 30 by _createdAt desc (what the admin scanner shows as "newest")
by_created = sanity_query(
    '*[_type=="newsArticle" && defined(title)] | order(_createdAt desc) [0...30]'
    '{ _id, title, "bodyLen": length(body), publishedAt, _createdAt, editorLocked, qualityReviewed }'
)
out["by_createdAt_desc"] = by_created

# Top 30 by publishedAt desc (what quality-rewrite actually fetches/operates on)
by_published = sanity_query(
    '*[_type=="newsArticle" && defined(title) && editorLocked != true] | order(publishedAt desc) [0...30]'
    '{ _id, title, "bodyLen": length(body), publishedAt, _createdAt, editorLocked, qualityReviewed }'
)
out["by_publishedAt_desc"] = by_published

created_ids = {d["_id"] for d in by_created}
published_ids = {d["_id"] for d in by_published}
out["missing_from_backfill_window"] = [
    d for d in by_created if d["_id"] not in published_ids and (d.get("bodyLen") or 0) < 100
]

# Overall counts
counts = sanity_query(
    '{'
    '"total": count(*[_type=="newsArticle"]),'
    '"missingBody": count(*[_type=="newsArticle" && (!defined(body) || length(body) < 100)]),'
    '"missingBodyLocked": count(*[_type=="newsArticle" && (!defined(body) || length(body) < 100) && editorLocked == true]),'
    '"missingBodyReviewed": count(*[_type=="newsArticle" && (!defined(body) || length(body) < 100) && qualityReviewed == true])'
    '}'
)
out["counts"] = counts

with open("docs/diag_missing_body_result.json", "w") as f:
    json.dump(out, f, indent=2, default=str)

print("done")
