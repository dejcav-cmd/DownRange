import urllib.request, json, os, time
B='https://www.downrangeco.com'; K=os.environ.get('ADMIN_KEY','')
def trig(job):
    try:
        r=urllib.request.urlopen(urllib.request.Request(B+'/api/admin/cron-status?trigger=true', data=json.dumps({'jobId':job}).encode(),
            headers={'x-admin-key':K,'Content-Type':'application/json','User-Agent':'Mozilla/5.0'}, method='POST'), timeout=120)
        return r.status, r.read().decode()[:300]
    except Exception as e: return 'ERR', str(e)[:200]
for j in ['backup','bible-update']:
    print('TRIGGER', j, *trig(j))
time.sleep(5)
d=json.loads(urllib.request.urlopen(urllib.request.Request(B+'/api/admin/cron-status',headers={'x-admin-key':K,'User-Agent':'Mozilla/5.0'}),timeout=60).read())
for j in d['jobs']:
    if j['id'] in ('backup','bible-update'):
        lr=j.get('lastRun') or {}
        print('STATUS', j['id'], j['status'], json.dumps({k:lr.get(k) for k in ('at','status','details','error')})[:400])
