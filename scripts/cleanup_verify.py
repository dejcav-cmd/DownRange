import urllib.request, json, os, base64
B='https://www.downrangeco.com/api/admin/content-cleanup'; K=os.environ['ADMIN_KEY']; out=[]
def req(method, url, body=None, key=K):
    r=urllib.request.Request(url, data=json.dumps(body).encode() if body else None, method=method, headers={'x-admin-key':key,'Content-Type':'application/json','User-Agent':'Mozilla/5.0'})
    try: x=urllib.request.urlopen(r,timeout=120); return x.status, json.loads(x.read())
    except urllib.error.HTTPError as e: return e.code, json.loads(e.read() or b'{}')
for t,d in [('news',30),('news',90),('deals',30),('deals',90)]:
    s,j=req('GET',f'{B}?type={t}&days={d}'); out.append(f"GET {t} {d}d -> {s} count={j.get('count')} total={j.get('total')} oldest={str(j.get('oldest'))[:10]} newest={str(j.get('newest'))[:10]}")
s,j=req('GET',f'{B}?type=news&days=3'); out.append(f'GET news 3d (below min) -> {s} {j}')
s,j=req('GET',f'{B}?type=news&days=90',key='wrong'); out.append(f'GET bad key -> {s}')
s,j=req('POST',B,{'type':'deals','days':90,'confirmCount':-1}); out.append(f'POST wrong confirmCount -> {s} {j}')
res='\n'.join(out); print(res)
api='https://api.github.com/repos/dejcav-cmd/DownRange/contents/scripts/cleanup_verify.txt'
urllib.request.urlopen(urllib.request.Request(api,data=json.dumps({'message':'chore: verify [skip ci]','content':base64.b64encode(res.encode()).decode()}).encode(),headers={'Authorization':'token '+os.environ['GH_TOKEN']},method='PUT'))
