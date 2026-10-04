import urllib.request, re, json, os, base64
UA={'User-Agent':'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148 Safari/604.1'}
B='https://www.downrangeco.com'; out=[]
get=lambda p: urllib.request.urlopen(urllib.request.Request(B+p,headers=UA),timeout=30).read().decode('utf-8','replace')
news=get('/news'); slug=re.search(r'href="/news/([a-z0-9-]{10,})"',news).group(1)
for p in [f'/news/{slug}', '/blog/dj-suppressors-nfa-tax-elimination-2026']:
    h=get(p); out.append(f"{p[:60]} layout={'dr-article-layout' in h} aside={'dr-article-aside' in h} related={'dr-related-grid' in h}")
css_links=set(re.findall(r'href="(/_next/static/css/[^"]+\.css)"',h))
for c in css_links:
    css=get(c); i=css.find('.dr-article-aside')
    out.append(f"css {c.split('/')[-1][:20]}: aside-rule={i>=0} ctx={css[max(0,i-120):i+60]!r}"[:260])
res='\n'.join(out); print(res)
urllib.request.urlopen(urllib.request.Request('https://api.github.com/repos/dejcav-cmd/DownRange/contents/scripts/mv.txt',data=json.dumps({'message':'chore [skip ci]','content':base64.b64encode(res.encode()).decode()}).encode(),headers={'Authorization':'token '+os.environ['GH_TOKEN']},method='PUT'))
