import urllib.request, urllib.error, re, json, html
B='https://www.downrangeco.com'
UA={'User-Agent':'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148 Safari/604.1'}
def get(p):
    try:
        r=urllib.request.urlopen(urllib.request.Request(B+p,headers=UA),timeout=45); return r.status, r.read().decode('utf-8','replace')
    except urllib.error.HTTPError as e: return e.code, ''
for st_ in ['TX','WA','VA','CA','WY']:
    st,h=get(f'/laws/{st_}')
    i=h.find('NEWS</div>'); blk=h[i:i+6000] if i>=0 else ''
    titles=[html.unescape(t) for t in re.findall(r'font-weight:700;color:#E5E5E5;line-height:1.3">([^<]+)<',blk)][:5]
    print(f'/laws/{st_}', st, 'news-block', i>=0, 'link', f'/state-news/{st_.lower()}' in h, 'lowercase-recip-links', len(re.findall(r'href="/laws/[a-z]{2}"',h)))
    for t in titles: print('    -', t[:95])
for p in ['/state-news','/state-news/tx','/state-news/wa']:
    st,h=get(p); ld=re.findall(r'<script type="application/ld\+json">(.*?)</script>',h,re.S)
    types=[]
    for b in ld:
        try:
            d=json.loads(b); types += [x.get('@type') for x in (d if isinstance(d,list) else [d])]
        except Exception: pass
    print(p, st, types)
st,sm=get('/sitemap.xml'); print('sitemap state-news urls', sm.count('/state-news'))
