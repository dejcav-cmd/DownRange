import urllib.request, urllib.parse, json, sys

SANITY_TOKEN = os.environ.get("SANITY_TOKEN","")
PROJECT = "vbnsqnkg"

import os

def sanity_query(query):
    encoded = urllib.parse.quote(query)
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/production?query={encoded}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {SANITY_TOKEN}"})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())["result"]

results = {}

slugs = [
    "watson-coleman-reintroduces-hear-act-to-ban-suppressors-just-as-the-suppressor-m-da853c",
    "the-best-cartridges-for-suppressed-shooting-1fed0c",
    "virginia-bill-sponsor-attacks-prosecutors-refusing-to-enforce-his-gun-ban-e2f031",
    "vortex-hunter-constantine-collaboration-benefits-saf-s-legal-efforts-c9b513"
]

article_data = []
for slug in slugs:
    q = f'*[_type=="newsArticle" && slug.current=="{slug}"][0]{{_id, title, imageUrl, externalUrl}}'
    r = sanity_query(q)
    article_data.append(r)
results["articles"] = article_data

results["deal_count"] = sanity_query('count(*[_type=="gunDeal"])')
results["deal_sample"] = sanity_query('*[_type=="gunDeal"][0...3]{_id,title,approved,publishedAt}')
results["review_sample"] = sanity_query('*[_type=="review"][0...3]{_id,title,imageUrl,"hasHeroImage":defined(heroImage.asset)}')

with open("scripts/diag-result.txt","w") as f:
    f.write(json.dumps(results,indent=2))
print("DONE")
