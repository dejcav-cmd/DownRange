import urllib.request, urllib.parse, json, os, base64

T = os.environ['SANITY_TOKEN']
GH = os.environ.get('GH_PAT','')
BASE = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production'

def q(query):
    url = BASE + '?query=' + urllib.parse.quote(query) + '&returnQuery=false'
    req = urllib.request.Request(url, headers={'Authorization': 'Bearer ' + T})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read()).get('result', [])

lines = []
def out(s=''):
    print(s); lines.append(s)

briefs = q('*[_type=="dailyBriefing"]|order(date desc)[0...5]{_id,date,status,headline}')
out(f'=== dailyBriefing docs: {len(briefs)} ===')
for b in briefs:
    out(f'  {b.get("date")} [{b.get("status")}] {(b.get("headline") or "")[:60]}')

out()
alerts = q('*[_type=="systemAlert"]|order(_createdAt desc)[0...5]{_id,title,level,_createdAt}')
out(f'=== systemAlert docs: {len(alerts)} ===')
for a in alerts:
    out(f'  {a.get("_createdAt","")[:16]} [{a.get("level")}] {a.get("title","")}')

out()
fails = q('*[_type=="cronRun" && status=="failed"]|order(_createdAt desc)[0...5]{jobId,status,_createdAt,details}')
out(f'=== Recent failed cron runs: {len(fails)} ===')
for f in fails:
    out(f'  {f.get("_createdAt","")[:16]} {f.get("jobId")} :: {(f.get("details") or "")[:60]}')

out()
recent = q('*[_type=="newsArticle"]|order(publishedAt desc)[0...3]{title,publishedAt}')
out(f'=== Recent newsArticle docs: {len(recent)} ===')
for a in recent:
    out(f'  {a.get("publishedAt","")[:16]} {(a.get("title") or "")[:60]}')

content = '\n'.join(lines)

# Write to ARTICLES.txt via GH API
if GH:
    sha_res = urllib.request.urlopen(
        urllib.request.Request('https://api.github.com/repos/dejcav-cmd/DownRange/contents/scripts/ARTICLES.txt',
        headers={'Authorization': f'token {GH}'}), timeout=10)
    sha = json.loads(sha_res.read()).get('sha','')
    body = json.dumps({'message':'ci: sanity check result','committer':{'name':'CI','email':'dj@downrangeco.com'},
                       'content':base64.b64encode(content.encode()).decode(),'sha':sha}).encode()
    urllib.request.urlopen(urllib.request.Request(
        'https://api.github.com/repos/dejcav-cmd/DownRange/contents/scripts/ARTICLES.txt',
        data=body, headers={'Authorization':f'token {GH}','Content-Type':'application/json'}, method='PUT'), timeout=10)
    print('Written to ARTICLES.txt')
