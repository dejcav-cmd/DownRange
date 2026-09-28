import urllib.request, urllib.error, re
B='https://www.downrangeco.com'
class NoRedir(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*a,**k): return None
op=urllib.request.build_opener(NoRedir)
UA={'User-Agent':'Mozilla/5.0 (compatible; Googlebot/2.1)'}
def get(path):
    try:
        r=op.open(urllib.request.Request(B+path,headers=UA),timeout=30); return r.status, r.read().decode('utf-8','replace')
    except urllib.error.HTTPError as e: return e.code, e.headers.get('Location','')
for p in ['/competitions','/ammo/9mm','/reviews','/reviews/sig-p365xl','/preparedness','/feeds/reviews','/feeds/competitions','/api/competitions','/hunting','/video','/video?cat=review']:
    print(p, get(p)[0])
sm=urllib.request.urlopen(urllib.request.Request(B+'/sitemap.xml',headers=UA),timeout=60).read().decode()
print('sitemap', sm.count('<loc>'), 'reviews', sm.count('/reviews'), 'competitions', sm.count('/competitions'), 'preparedness', sm.count('/preparedness'))
st, v = get('/video')
for w in ['>Reviews<','>Training<','>Builds<','>Competition<','>History<','VIDEOS']: print('video has', w, w in v)
st, h = get('/news')
nav = h[:60000]
print('nav Reviews link', 'href="/reviews"' in nav, '| nav Preparedness', 'href="/preparedness"' in nav, '| nav Hunting', 'href="/hunting"' in nav)
