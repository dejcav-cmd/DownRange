import urllib.request, json, os, time
B='https://www.downrangeco.com'; K=os.environ['ADMIN_KEY']
try:
    r=urllib.request.urlopen(urllib.request.Request(B+'/api/admin/cron-status?trigger=true', data=json.dumps({'jobId':'nra-law-sync-enhanced'}).encode(),
        headers={'x-admin-key':K,'Content-Type':'application/json','User-Agent':'Mozilla/5.0'}, method='POST'), timeout=70)
    print('trigger', r.status, r.read().decode()[:300])
except Exception as e: print('trigger', str(e)[:200])
time.sleep(260)
d=json.loads(urllib.request.urlopen(urllib.request.Request(B+'/api/admin/cron-status',headers={'x-admin-key':K,'User-Agent':'Mozilla/5.0'}),timeout=60).read())
out=[]
for j in d['jobs']:
    if j['id'].startswith('nra-law-sync'):
        out.append('== %s %s' % (j['id'], j['status']))
        for h in (j.get('history') or [])[:3]: out.append('    '+json.dumps({k:h.get(k) for k in ('at','status','ms','trigger','details','error')})[:420])
print('\n'.join(out))
import base64
tok=os.environ['GH_TOKEN']; api='https://api.github.com/repos/dejcav-cmd/DownRange/contents/scripts/verify_nra_result.txt'
body={'message':'chore: nra verify result [skip ci]','content':base64.b64encode('\n'.join(out).encode()).decode()}
urllib.request.urlopen(urllib.request.Request(api,data=json.dumps(body).encode(),headers={'Authorization':'token '+tok},method='PUT'))
