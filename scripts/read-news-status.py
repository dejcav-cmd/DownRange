#!/usr/bin/env python3
import json, urllib.request, urllib.parse, os, base64

TOKEN   = os.environ.get('SANITY_TOKEN','')
GH_PAT  = os.environ.get('GH_PAT','')
REPO    = 'dejcav-cmd/DownRange'
GH_HDRS = {'Authorization': f'token {GH_PAT}', 'User-Agent': 'curl',
           'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json'}
S_HDRS  = {'Authorization': f'Bearer {TOKEN}'}

def sq(groq):
    url = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production?query=' + urllib.parse.quote(groq)
    req = urllib.request.Request(url, headers=S_HDRS)
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())['result']

lines = []
count = sq('count(*[_type == "newsArticle"])')
lines.append(f'TOTAL_ARTICLES: {count}')

# Show mirror + freerepublic articles with their actual externalUrl
lines.append('MIRROR/FREEREPUBLIC ARTICLES (with externalUrl):')
suspect = sq('*[_type=="newsArticle" && (source match "Mirror" || source match "mirror" || source match "Freerepublic" || source match "freerepublic")]|order(publishedAt desc)[0...10]{_id,title,source,externalUrl}')
for a in suspect:
    lines.append(f'  ID: {a.get("_id","")} | src: {a.get("source","")} | url: {a.get("externalUrl","")[:70]}')
if not suspect:
    lines.append('  none found')

lines.append('LAST_10:')
recent = sq('*[_type=="newsArticle"]|order(publishedAt desc)[0...10]{publishedAt,source,_createdAt,title}')
for a in recent:
    lines.append(f'  {str(a.get("publishedAt",""))[:16]} | {str(a.get("source",""))[:22]:<22} | {a.get("title","")[:50]}')

output = chr(10).join(lines)
print(output)

req = urllib.request.Request(f'https://api.github.com/repos/{REPO}/git/refs/heads/main', headers=GH_HDRS)
with urllib.request.urlopen(req) as r:
    main_sha = json.loads(r.read())['object']['sha']

branch_payload = json.dumps({'ref':'refs/heads/status-output','sha':main_sha}).encode()
try:
    req2 = urllib.request.Request(f'https://api.github.com/repos/{REPO}/git/refs',
        data=branch_payload, headers=GH_HDRS, method='POST')
    with urllib.request.urlopen(req2) as r: pass
except:
    req2b = urllib.request.Request(f'https://api.github.com/repos/{REPO}/git/refs/heads/status-output',
        data=json.dumps({'sha':main_sha,'force':True}).encode(), headers=GH_HDRS, method='PATCH')
    with urllib.request.urlopen(req2b) as r: pass

file_sha = None
try:
    req3 = urllib.request.Request(f'https://api.github.com/repos/{REPO}/contents/STATUS.txt?ref=status-output', headers=GH_HDRS)
    with urllib.request.urlopen(req3) as r:
        file_sha = json.loads(r.read())['sha']
except: pass

payload = {'message':'chore: status output','content':base64.b64encode(output.encode()).decode(),'branch':'status-output','author':{'name':'DJ Cavalcanti','email':'dj@downrangeco.com'}}
if file_sha: payload['sha'] = file_sha
req4 = urllib.request.Request(f'https://api.github.com/repos/{REPO}/contents/STATUS.txt',
    data=json.dumps(payload).encode(), headers=GH_HDRS, method='PUT')
with urllib.request.urlopen(req4) as r:
    print('STATUS WRITTEN')
