import os, json, urllib.request, urllib.parse, datetime

TOKEN   = os.environ.get('SANITY_TOKEN', '')
PROJECT = 'vbnsqnkg'

def query_sanity(q):
    url = f'https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/production?query={urllib.parse.quote(q)}&returnQuery=false'
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {TOKEN}'})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())['result']

NOW = datetime.datetime.utcnow()
DAY_AGO  = (NOW - datetime.timedelta(hours=24)).isoformat() + 'Z'
WEEK_AGO = (NOW - datetime.timedelta(days=7)).isoformat() + 'Z'

# All jobs we care about
JOBS = ['news', 'laws', 'releases', 'market', 'video', 'canada', 'brazil',
        'state', 'quality-rewrite', 'gun-deals', 'fix-placeholder-images',
        'cron-health', 'sitemap']

print(f"Cron status check — {NOW.strftime('%Y-%m-%d %H:%M UTC')}\n")
print(f"{'JOB':<28} {'LAST RUN':<22} {'STATUS':<10} {'AGO':<12} {'DETAIL'}")
print('-' * 100)

issues = []

for job in JOBS:
    try:
        docs = query_sanity(
            f'*[_type=="cronRun" && jobId=="{job}"] | order(at desc) [0...1] '
            f'{{jobId, status, at, ms, error, details}}'
        )
        if not docs:
            print(f"  {'NEVER RUN':<28} {job}")
            issues.append(f"NEVER RUN: {job}")
            continue
        d = docs[0]
        ran_at = d.get('at', '')
        status = d.get('status', '?')
        error  = (d.get('error') or d.get('details') or '')[:60]
        
        # Calculate how long ago
        try:
            dt = datetime.datetime.fromisoformat(ran_at.replace('Z','+00:00'))
            ago_sec = (NOW.replace(tzinfo=datetime.timezone.utc) - dt).total_seconds()
            if ago_sec < 3600:
                ago = f"{int(ago_sec/60)}m ago"
            elif ago_sec < 86400:
                ago = f"{int(ago_sec/3600)}h ago"
            else:
                ago = f"{int(ago_sec/86400)}d ago"
        except:
            ago = '?'
        
        mark = '✓' if status == 'success' else '✗'
        print(f"  {mark} {job:<26} {ran_at[:19]:<22} {status:<10} {ago:<12} {error}")
        
        if status != 'success':
            issues.append(f"FAILED: {job} — {error}")
        if ago_sec > 3600 and job == 'news':
            issues.append(f"STALE: {job} last ran {ago} (expected every 15min)")
        elif ago_sec > 14400 and job in ['market', 'canada', 'brazil']:
            issues.append(f"STALE: {job} last ran {ago}")
            
    except Exception as e:
        print(f"  ? {job:<26} ERROR: {e}")
        issues.append(f"ERROR checking {job}: {e}")

print('\n')
if issues:
    print(f"⚠️  {len(issues)} ISSUE(S) FOUND:")
    for i in issues:
        print(f"  - {i}")
else:
    print("✓ All jobs healthy")

# Also check recent news article count
print('\n=== Recent news articles ===')
try:
    yesterday = DAY_AGO
    docs = query_sanity(
        f'*[_type=="newsArticle" && approved==true && publishedAt > "{yesterday}"] '
        f'| order(publishedAt desc) [0...5] {{title, source, publishedAt}}'
    )
    print(f"Articles in last 24h: {len(docs)}")
    for d in docs[:5]:
        print(f"  {d.get('publishedAt','?')[:16]} | {d.get('source','?')[:20]} | {d.get('title','?')[:60]}")
    if not docs:
        print("  *** NO ARTICLES IN LAST 24 HOURS ***")
except Exception as e:
    print(f"Error checking articles: {e}")
