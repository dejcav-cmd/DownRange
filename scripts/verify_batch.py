import urllib.request, json, os
B='https://www.downrangeco.com'; K=os.environ.get('ADMIN_KEY','')
d=json.loads(urllib.request.urlopen(urllib.request.Request(B+'/api/admin/cron-status',headers={'x-admin-key':K,'User-Agent':'Mozilla/5.0'}),timeout=60).read())
for j in d['jobs']:
    if j['id'] in ('laws','prn_releases'):
        print('==', j['id'], j['status'])
        for h in (j.get('history') or [])[:4]: print('   ', json.dumps(h)[:400])
