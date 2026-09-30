import urllib.request, json, os, time, base64
B='https://www.downrangeco.com'; K=os.environ['ADMIN_KEY']
def call(path, method='GET'):
    t=time.time()
    try:
        r=urllib.request.urlopen(urllib.request.Request(B+path, method=method, headers={'x-admin-key':K,'User-Agent':'Mozilla/5.0'}), timeout=60)
        raw=r.read(); ms=int((time.time()-t)*1000)
        try: d=json.loads(raw)
        except Exception: return f'{r.status} {ms}ms {len(raw)//1024}KB NON-JSON'
        counts={k:(len(v) if isinstance(v,list) else v) for k,v in d.items() if isinstance(v,(list,int,bool,str)) and k not in ('error',)} if isinstance(d,dict) else {'list':len(d)}
        return f'{r.status} {ms}ms {len(raw)//1024}KB {json.dumps(counts)[:220]}'
    except urllib.error.HTTPError as e:
        return f'HTTP {e.code} {int((time.time()-t)*1000)}ms {e.read()[:200]!r}'
    except Exception as e:
        return f'ERR {int((time.time()-t)*1000)}ms {str(e)[:150]}'
out=['## Content panel APIs (as the admin UI calls them)']
for p in ['/api/admin/articles-list?all=1&type=newsArticle','/api/admin/releases-manager?all=1&type=firearmRelease',
          '/api/admin/blog-posts?all=1&type=blogPost','/api/canada?all=1','/api/brazil?all=1','/api/admin/drafts']:
    out.append(f'{p}: {call(p)}')
out.append('## Blog writer cron history')
d=json.loads(urllib.request.urlopen(urllib.request.Request(B+'/api/admin/cron-status',headers={'x-admin-key':K,'User-Agent':'Mozilla/5.0'}),timeout=60).read())
for j in d['jobs']:
    if j['id'] in ('blog-writer','blog-twitter-promo'):
        out.append(f"{j['id']} status={j['status']} lastRunAge={j.get('lastRunAge')}m")
        for h in (j.get('history') or [])[:6]: out.append('   '+json.dumps({k:h.get(k) for k in ('at','status','ms','trigger','details','error')})[:330])
open('/tmp/out.txt','w').write('\n'.join(out))
api='https://api.github.com/repos/dejcav-cmd/DownRange/contents/scripts/admin_audit_result.txt'
urllib.request.urlopen(urllib.request.Request(api,data=json.dumps({'message':'chore: admin audit result [skip ci]','content':base64.b64encode('\n'.join(out).encode()).decode()}).encode(),headers={'Authorization':'token '+os.environ['GH_TOKEN']},method='PUT'))
