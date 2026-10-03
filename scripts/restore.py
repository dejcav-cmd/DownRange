import os, json, base64, urllib.request, urllib.parse
TOK=os.environ['SANITY_API_TOKEN'].replace('ST=','').strip()
BASE='https://vbnsqnkg.api.sanity.io/v2024-01-01/data'
docs=json.load(open('scripts/restore_news.json'))
def mutate(muts):
    r=urllib.request.Request(f'{BASE}/mutate/production?returnDocuments=false',data=json.dumps({'mutations':muts}).encode(),headers={'Authorization':'Bearer '+TOK,'Content-Type':'application/json'},method='POST')
    return json.loads(urllib.request.urlopen(r,timeout=120).read())
out=[]; ok=0; err=[]
for i in range(0,len(docs),100):
    batch=docs[i:i+100]
    try:
        mutate([{'createIfNotExists':d} for d in batch]); ok+=len(batch)
    except urllib.error.HTTPError as e:
        msg=e.read()[:300]; err.append(str(msg))
        # retry without _createdAt if Sanity rejects it
        try: mutate([{'createIfNotExists':{k:v for k,v in d.items() if k!='_createdAt'}} for d in batch]); ok+=len(batch)
        except Exception as e2: err.append(str(e2)[:200])
def q(g,p):
    u=f'{BASE}/query/production?query='+urllib.parse.quote(g)+''.join(f'&${k}='+urllib.parse.quote(json.dumps(v)) for k,v in p.items())
    return json.loads(urllib.request.urlopen(urllib.request.Request(u,headers={'Authorization':'Bearer '+TOK}),timeout=60).read())['result']
ids=[d['_id'] for d in docs]
present=q('count(*[_id in $ids])',{'ids':ids})
total=q('count(*[_type=="newsArticle" && approved==true])',{})
out.append(f'submitted {ok}/{len(docs)}; now present {present}/{len(docs)}; approved news total {total}')
if err: out.append('errors: '+' | '.join(err)[:600])
res='\n'.join(out); print(res)
urllib.request.urlopen(urllib.request.Request('https://api.github.com/repos/dejcav-cmd/DownRange/contents/scripts/restore_result.txt',data=json.dumps({'message':'chore: restore result [skip ci]','content':base64.b64encode(res.encode()).decode()}).encode(),headers={'Authorization':'token '+os.environ['GH_TOKEN']},method='PUT'))
