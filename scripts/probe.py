import urllib.request, json, os, base64
URLS=['https://gun.deals/feed/syndication/rss','https://gun.deals/rss.xml','https://gun.deals/feed','https://gun.deals/rss','https://gun.deals/feed.rss','https://gun.deals/','https://gun.deals/robots.txt']
UAS={'cron':'DownRange/1.0 (+https://downrangeco.com)','browser':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36'}
out=[]
for u in URLS:
    for name,ua in UAS.items():
        try:
            r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':ua,'Accept':'application/rss+xml,application/xml,text/html,*/*'}),timeout=15)
            body=r.read(400000).decode('utf-8','replace')
            out.append(f"{r.status} {name:7} {u} ct={r.headers.get('content-type','')[:30]} items={body.count('<item')} server={r.headers.get('server')} final={r.url}")
            if u.endswith('robots.txt') and name=='browser': out.append('   robots: '+' | '.join(l for l in body.splitlines() if 'sitemap' in l.lower() or 'feed' in l.lower() or 'rss' in l.lower())[:300])
            if u=='https://gun.deals/' and name=='browser':
                import re; out.append('   rss links: '+', '.join(set(re.findall(r'href="([^"]*(?:rss|feed)[^"]*)"',body)))[:400])
        except urllib.error.HTTPError as e:
            out.append(f"{e.code} {name:7} {u} server={e.headers.get('server')} cf-mitigated={e.headers.get('cf-mitigated')} body={e.read(160)!r}")
        except Exception as e:
            out.append(f"ERR {name:7} {u} {str(e)[:100]}")
res='\n'.join(out); print(res)
urllib.request.urlopen(urllib.request.Request('https://api.github.com/repos/dejcav-cmd/DownRange/contents/scripts/probe_result.txt',data=json.dumps({'message':'chore [skip ci]','content':base64.b64encode(res.encode()).decode()}).encode(),headers={'Authorization':'token '+os.environ['GH_TOKEN']},method='PUT'))
