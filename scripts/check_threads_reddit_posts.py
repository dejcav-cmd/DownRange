import os, json, requests
TOKEN = os.environ["SANITY_API_TOKEN"].replace("ST=", "").strip()
q = '*[_type == "socialPost" && platform in ["threads","reddit"]] | order(_createdAt desc)[0...12]{platform, status, articleTitle, error, postUrl, postedAt, _createdAt}'
r = requests.get("https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production", params={"query": q}, headers={"Authorization": f"Bearer {TOKEN}"})
print(json.dumps(r.json().get("result"), indent=2))
