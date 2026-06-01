#!/usr/bin/env python3
import json, urllib.request, urllib.parse, os

SANITY_TOKEN = os.environ.get('SANITY_TOKEN','')
GH_TOKEN     = os.environ.get('GH_PAT','')

def q(groq):
    hdrs = {'Authorization': f'Bearer {SANITY_TOKEN}'}
    url  = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production?query=' + urllib.parse.quote(groq)
    req  = urllib.request.Request(url, headers=hdrs)
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())['result']

lines = []
count = q('count(*[_type == "newsArticle"])')
lines.append(f'ARTICLE_COUNT: {count}')

recent = q('*[_type == "newsArticle"] | order(publishedAt desc) [0...10] { title, publishedAt, source, _createdAt }')
lines.append('RECENT_10:')
for a in recent:
    lines.append(f'  {a.get("publishedAt","?")[:16]} | {str(a.get("source","?"))[:25]:<25} | {a.get("title","?")[:55]}')

crons = q('*[_type == "cronRun"] | order(_createdAt desc) [0...8] { feed, status, details, _createdAt }')
lines.append('RECENT_CRON_RUNS:')
for c in crons:
    lines.append(f'  {c.get("_createdAt","?")[:16]} | {str(c.get("feed","?")):<20} | {c.get("status")} | {c.get("details","")[:60]}')
if not crons:
    lines.append('  (none found)')

output = chr(10).join(lines)
print(output)

# Post as a gist
gist_payload = json.dumps({
    'description': 'DownRange news status',
    'public': False,
    'files': {'news-status.txt': {'content': output}}
}).encode()
gist_req = urllib.request.Request(
    'https://api.github.com/gists',
    data=gist_payload,
    headers={'Authorization': f'token {GH_TOKEN}', 'User-Agent': 'curl',
             'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json'},
    method='POST'
)
with urllib.request.urlopen(gist_req) as r:
    gist = json.loads(r.read())
    print(f'GIST_ID: {gist["id"]}')
    print(f'GIST_URL: {gist["html_url"]}')
