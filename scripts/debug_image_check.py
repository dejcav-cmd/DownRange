import urllib.request, urllib.parse, json, os, sys

token = os.environ.get("SANITY_TOKEN", "")
if not token:
    print("ERROR: No SANITY_TOKEN")
    sys.exit(1)

results_lines = []

# Query the specific article
slug = "mark-xix-desert-eagle-suppressor-ready-69efb4"
q = '*[_type == "newsArticle" && slug.current == "' + slug + '"] { _id, title, imageUrl, externalUrl, category, heroImage }'
url = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production?query=" + urllib.parse.quote(q)
req = urllib.request.Request(url, headers={"Authorization": "Bearer " + token})
with urllib.request.urlopen(req) as r:
    data = json.loads(r.read())

result = data.get("result", [])
results_lines.append(f"FOUND: {len(result)} docs matching slug")
for doc in result:
    results_lines.append(f"  ID:           {doc.get('_id')}")
    results_lines.append(f"  TITLE:        {doc.get('title')}")
    results_lines.append(f"  IMAGE_URL:    {doc.get('imageUrl')}")
    results_lines.append(f"  EXTERNAL_URL: {doc.get('externalUrl')}")
    results_lines.append(f"  CATEGORY:     {doc.get('category')}")
    results_lines.append(f"  HERO_IMAGE:   {json.dumps(doc.get('heroImage'))}")

# Check recent 20 news articles and their imageUrls to see patterns
results_lines.append("\n--- RECENT 20 NEWS ARTICLES IMAGE URLS ---")
q3 = '*[_type == "newsArticle" && approved == true] | order(publishedAt desc) [0...20] { _id, title, imageUrl, category }'
url3 = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production?query=" + urllib.parse.quote(q3)
req3 = urllib.request.Request(url3, headers={"Authorization": "Bearer " + token})
with urllib.request.urlopen(req3) as r3:
    data3 = json.loads(r3.read())
for doc in data3.get("result", []):
    results_lines.append(f"  [{doc.get('category','?')}] {doc.get('title','')[:60]} | {doc.get('imageUrl','null')[:80] if doc.get('imageUrl') else 'NULL'}")

output = "\n".join(results_lines)
print(output)

# Write to file for commit
with open("scripts/debug_image_results.txt", "w") as f:
    f.write(output)
