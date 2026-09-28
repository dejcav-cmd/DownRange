import urllib.request, urllib.error
B='https://www.downrangeco.com'
class NoRedir(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*a,**k): return None
op=urllib.request.build_opener(NoRedir)
def st(path):
    try:
        r=op.open(urllib.request.Request(B+path,headers={'User-Agent':'Mozilla/5.0 (compatible; Googlebot/2.1)'}),timeout=30); return r.status, ''
    except urllib.error.HTTPError as e: return e.code, e.headers.get('Location','')
sm=urllib.request.urlopen(urllib.request.Request(B+'/sitemap.xml',headers={'User-Agent':'Mozilla/5.0'}),timeout=60).read().decode()
print('sitemap urls', sm.count('<loc>'), 'state-hub', sm.count('/state-hub/'), 'guns', sm.count('/guns'))
for p in ['/guns','/guns/glock-19','/laws/TX','/laws/states','/state-hub','/state-hub/TX','/ccw','/state-intel','/ranges','/ffl-finder','/learn']:
    print(p, *st(p))
