
import requests, json, os, time, urllib.parse

T = os.environ.get("SANITY_TOKEN","")
CRON = os.environ.get("CRON_SECRET","")
P = "vbnsqnkg"
H = {"Authorization": "Bearer " + T}
BASE = "https://" + P + ".api.sanity.io/v2024-01-01/data/query/production"

def q(query):
    r = requests.get(BASE, params={"query": query, "returnQuery": "false"}, headers=H, timeout=15)
    return r.json()["result"]

out = {}
out["total_before"] = q('count(*[_type == "newsArticle"])')
out["approved"] = q('count(*[_type == "newsArticle" && approved == true])')
out["since_jun"] = q('count(*[_type == "newsArticle" && _createdAt > "2026-06-01"])')
out["latest3"] = q('*[_type == "newsArticle"] | order(_createdAt desc)[0...3]{title, _createdAt, "slug": slug.current, approved}')
out["crons"] = q('*[_type == "cronRun" && sourceId == "news"] | order(_updatedAt desc)[0...5]{status, details, error, _updatedAt}')
out["broken"] = q('*[_id == "news-ed2885a86a33802b8759352ff4b98b4a"][0]{_id, title, "slug": slug.current, approved, externalUrl}')

print("BEFORE:", json.dumps(out, indent=2))

# Trigger the news agent
print("Triggering agent...")
resp = requests.get(
    "https://downrangeco.com/api/agent?feed=news",
    headers={"Authorization": "Bearer " + CRON, "x-vercel-cron": "1"},
    timeout=180
)
out["agent_status"] = resp.status_code
out["agent_response"] = resp.text[:2000]
print("Agent:", resp.status_code, resp.text[:300])

time.sleep(15)
out["total_after"] = q('count(*[_type == "newsArticle"])')
out["delta"] = out["total_after"] - out["total_before"]
out["latest3_after"] = q('*[_type == "newsArticle"] | order(_createdAt desc)[0...3]{title, _createdAt, "slug": slug.current, approved}')
print("AFTER:", json.dumps(out, indent=2))
print("DELTA:", out["delta"], "new articles")

with open("agent_test_results.json", "w") as f:
    json.dump(out, f, indent=2)
