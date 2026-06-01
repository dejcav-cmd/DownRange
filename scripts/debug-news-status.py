#!/usr/bin/env python3
"""Debug: check news feed status via Sanity"""
import json, urllib.request, urllib.parse, os

TOKEN   = os.environ.get("SANITY_TOKEN", "")
PROJECT = "vbnsqnkg"
BASE    = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

def q(groq):
    url = BASE + "/query/production?query=" + urllib.parse.quote(groq)
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())["result"]

print("=== ARTICLE COUNT ===")
count = q('count(*[_type == "newsArticle"])')
print(f"Total newsArticles: {count}")

print("\n=== LAST 10 ARTICLES (by publishedAt) ===")
recent = q('*[_type == "newsArticle"] | order(publishedAt desc) [0...10] { title, publishedAt, source, _createdAt }')
for a in recent:
    print(f"  {a.get('publishedAt','?')[:16]} | {a.get('source','?')[:25]} | {a.get('title','?')[:60]}")

print("\n=== LAST 5 CRON RUNS (news) ===")
crons = q('*[_type == "cronRun" && feed == "news"] | order(_createdAt desc) [0...5] { feed, status, details, _createdAt }')
for c in crons:
    print(f"  {c.get('_createdAt','?')[:16]} | {c.get('status')} | {c.get('details','')[:80]}")

print("\n=== ANY CRON RUNS (last 5) ===")
allcrons = q('*[_type == "cronRun"] | order(_createdAt desc) [0...5] { feed, status, details, _createdAt }')
for c in allcrons:
    print(f"  {c.get('_createdAt','?')[:16]} | {c.get('feed')} | {c.get('status')} | {c.get('details','')[:60]}")
