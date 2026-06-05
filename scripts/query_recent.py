import urllib.request, urllib.parse, json, os
T = os.environ['SANITY_TOKEN']
BASE = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production'

def q(query):
    url = BASE + '?query=' + urllib.parse.quote(query) + '&returnQuery=false'
    req = urllib.request.Request(url, headers={'Authorization': 'Bearer ' + T})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read()).get('result', [])

briefs = q('*[_type=="dailyBriefing"]|order(date desc)[0...5]{_id,date,status,headline}')
print(f'dailyBriefing docs: {len(briefs)}')
for b in briefs:
    print(f'  {b.get("date")} {b.get("status")} {(b.get("headline") or "")[:50]}')

alerts = q('*[_type=="systemAlert"]|order(_createdAt desc)[0...5]{_id,title,level,_createdAt}')
print(f'systemAlert docs: {len(alerts)}')
for a in alerts:
    print(f'  {a.get("_createdAt","")[:16]} [{a.get("level")}] {a.get("title","")}')
    
# Also check cronRun for recent failures
fails = q('*[_type=="cronRun" && status=="failed"]|order(_createdAt desc)[0...5]{jobId,status,_createdAt,details}')
print(f'Recent failed cron runs: {len(fails)}')
for f in fails:
    print(f'  {f.get("_createdAt","")[:16]} {f.get("jobId")} {f.get("details","")}')
