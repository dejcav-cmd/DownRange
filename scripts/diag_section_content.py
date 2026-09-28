import os, json, urllib.request, urllib.parse, collections
TOK = os.environ['SANITY_API_TOKEN'].replace('ST=', '').strip()
def q(query):
    u = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production?query=' + urllib.parse.quote(query)
    return json.loads(urllib.request.urlopen(urllib.request.Request(u, headers={'Authorization': 'Bearer ' + TOK}), timeout=120).read())['result']
docs = q('*[!(_id in path("drafts.**"))]{_type,_createdAt,_updatedAt,publishedAt,category,type,status,approved,endDate,active}')
agg = collections.defaultdict(lambda: {'n': 0, 'last_created': '', 'last_pub': '', 'c30': 0, 'c90': 0, 'sub': collections.Counter()})
for d in docs:
    a = agg[d['_type']]; a['n'] += 1
    cr = d.get('_createdAt') or ''; pb = d.get('publishedAt') or ''
    a['last_created'] = max(a['last_created'], cr); a['last_pub'] = max(a['last_pub'], pb if isinstance(pb, str) else '')
    if cr >= '2026-08-29': a['c30'] += 1
    if cr >= '2026-06-30': a['c90'] += 1
    for k in ('category', 'type', 'status'):
        if d.get(k): a['sub'][f'{k}={d[k]}'] += 1
out = {t: {**v, 'sub': dict(v['sub'].most_common(8))} for t, v in sorted(agg.items(), key=lambda x: -x[1]['n'])}
g = q('*[_type=="giveaway"]{title,endDate,active,status,_updatedAt}')
cr = q('*[_type=="cronRun"] | order(_updatedAt desc) {jobId,status,_updatedAt,details}[0...400]')
last = {}
for r in cr:
    last.setdefault(r.get('jobId'), r)
print(json.dumps({'types': out, 'giveaways': g, 'cron_last': last}, indent=1, default=str))
