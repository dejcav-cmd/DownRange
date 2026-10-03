import urllib.request, json, os, base64, time
B='https://www.downrangeco.com'; K=os.environ['ADMIN_KEY']; out=[]
try:
    r=urllib.request.urlopen(urllib.request.Request(B+'/api/admin/cron-status?trigger=true',data=json.dumps({'jobId':'gun-deals'}).encode(),headers={'x-admin-key':K,'Content-Type':'application/json','User-Agent':'Mozilla/5.0'},method='POST'),timeout=120)
    out.append('trigger %s %s' % (r.status, r.read().decode()[:400]))
except Exception as e: out.append('trigger err '+str(e)[:200])
time.sleep(5)
d=json.loads(urllib.request.urlopen(urllib.request.Request(B+'/api/admin/cron-status',headers={'x-admin-key':K,'User-Agent':'Mozilla/5.0'}),timeout=60).read())
for j in d['jobs']:
    if j['id']=='gun-deals':
        out.append(f"status={j['status']}")
        for h in (j.get('history') or [])[:4]: out.append('   '+json.dumps({k:h.get(k) for k in ('at','status','ms','trigger','details','error')})[:300])
res='\n'.join(out); print(res)
urllib.request.urlopen(urllib.request.Request('https://api.github.com/repos/dejcav-cmd/DownRange/contents/scripts/probe_result.txt',data=json.dumps({'message':'chore [skip ci]','content':base64.b64encode(res.encode()).decode(),'sha':os.environ.get('PSHA','')} if os.environ.get('PSHA') else {'message':'chore [skip ci]','content':base64.b64encode(res.encode()).decode()}).encode(),headers={'Authorization':'token '+os.environ['GH_TOKEN']},method='PUT'))
