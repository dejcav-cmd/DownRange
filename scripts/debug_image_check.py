import urllib.request, urllib.parse, json, os, sys

token = os.environ.get("SANITY_TOKEN", "")
if not token:
    print("ERROR: No SANITY_TOKEN")
    sys.exit(1)

# Query the specific article
slug = "mark-xix-desert-eagle-suppressor-ready-69efb4"
q = '*[_type == "newsArticle" && slug.current == "' + slug + '"] { _id, title, imageUrl, externalUrl, category, heroImage }'
url = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production?query=" + urllib.parse.quote(q)
req = urllib.request.Request(url, headers={"Authorization": "Bearer " + token})
with urllib.request.urlopen(req) as r:
    data = json.loads(r.read())

result = data.get("result", [])
print(f"FOUND: {len(result)} docs matching slug")
for doc in result:
    print(f"  ID:           {doc.get('_id')}")
    print(f"  TITLE:        {doc.get('title')}")
    print(f"  IMAGE_URL:    {doc.get('imageUrl')}")
    print(f"  EXTERNAL_URL: {doc.get('externalUrl')}")
    print(f"  CATEGORY:     {doc.get('category')}")
    print(f"  HERO_IMAGE:   {doc.get('heroImage')}")

# Also check for any news articles with thermal-related imageUrl
print("\n--- Articles with 'thermal' in imageUrl or title ---")
q2 = '*[_type == "newsArticle" && (imageUrl match "*thermal*" || title match "*thermal*")] | order(publishedAt desc) [0...10] { _id, title, imageUrl, externalUrl }'
url2 = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production?query=" + urllib.parse.quote(q2)
req2 = urllib.request.Request(url2, headers={"Authorization": "Bearer " + token})
with urllib.request.urlopen(req2) as r2:
    data2 = json.loads(r2.read())
for doc in data2.get("result", []):
    print(f"  TITLE: {doc.get('title')}")
    print(f"  IMAGE: {doc.get('imageUrl')}")
    print()
