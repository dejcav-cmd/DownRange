import urllib.request, json, os, concurrent.futures, time
B='https://www.downrangeco.com'; K=os.environ.get('ADMIN_KEY','')
def trig(job):
    t=time.time()
    try:
        r=urllib.request.urlopen(urllib.request.Request(B+'/api/admin/cron-status?trigger=true', data=json.dumps({'jobId':job}).encode(),
            headers={'x-admin-key':K,'Content-Type':'application/json','User-Agent':'Mozilla/5.0'}, method='POST'), timeout=300)
        return job, r.status, round(time.time()-t), r.read().decode()[:260]
    except Exception as e: return job, 'ERR', round(time.time()-t), str(e)[:200]
with concurrent.futures.ThreadPoolExecutor(3) as ex:
    for res in ex.map(trig, ['laws','prn_releases','releases-process']): print('TRIGGER', *res)
time.sleep(5)
d=json.loads(urllib.request.urlopen(urllib.request.Request(B+'/api/admin/cron-status',headers={'x-admin-key':K,'User-Agent':'Mozilla/5.0'}),timeout=60).read())
for j in sorted(d['jobs'], key=lambda x:(str(x['status']),x['id'])):
    lr=j.get('lastRun') or {}
    print(f"{str(j['status']):8} {j['id']:24} {str(j.get('lastRunAge')):>6}m  {str(lr.get('details') or lr.get('error') or '')[:100]}")
