import urllib.request, json, os, base64
B='https://www.downrangeco.com/api/admin/content-cleanup'; K=os.environ['ADMIN_KEY']; out=[]
def req(m,u,b=None):
    r=urllib.request.Request(u,data=json.dumps(b).encode() if b else None,method=m,headers={'x-admin-key':K,'Content-Type':'application/json','User-Agent':'Mozilla/5.0'})
    try: x=urllib.request.urlopen(r,timeout=120); return x.status,json.loads(x.read())
    except urllib.error.HTTPError as e: return e.code,json.loads(e.read() or b'{}')
out.append('PUT  %s %s' % req('PUT',B,{'monthlyEnabled':True,'dealsDays':60,'newsDays':180}))
out.append('GET  %s %s' % req('GET',B+'?settings=1'))
for t,d in [('news',180),('deals',60)]:
    s,j=req('GET',f'{B}?type={t}&days={d}'); out.append(f"PREVIEW {t} >{d}d: {s} count={j.get('count')} of {j.get('total')} oldest={str(j.get('oldest'))[:10]} newest={str(j.get('newest'))[:10]}")
res='\n'.join(out); print(res)
urllib.request.urlopen(urllib.request.Request('https://api.github.com/repos/dejcav-cmd/DownRange/contents/scripts/rs.txt',data=json.dumps({'message':'chore [skip ci]','content':base64.b64encode(res.encode()).decode()}).encode(),headers={'Authorization':'token '+os.environ['GH_TOKEN']},method='PUT'))
