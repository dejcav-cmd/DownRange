import urllib.request, urllib.error, re
B='https://www.downrangeco.com'
REMOVED=['/competitions','/reviews','/preparedness','/ammo/','/state-hub','/state-intel','"/ccw"','video?cat=']
def get(path, ua):
    try:
        r=urllib.request.urlopen(urllib.request.Request(B+path,headers={'User-Agent':ua}),timeout=45); return r.status, r.read().decode('utf-8','replace')
    except urllib.error.HTTPError as e: return e.code, ''
DESK='Mozilla/5.0 (compatible; Googlebot/2.1)'
MOB='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1'
for label, ua in (('desktop',DESK),('mobile',MOB)):
    for p in ['/','/news','/video','/hunting','/guns','/laws/TX','/precision','/training','/safe-storage','/about']:
        st, h = get(p, ua)
        hits=[r for r in REMOVED if r in h]
        print(label, p, st, 'removed-refs:', hits or 'none')
st, h = get('/', DESK)
m=re.search(r'<meta name="description" content="([^"]+)"', h); print('home meta:', m.group(1)[:140] if m else None)
st, h = get('/about', DESK); print('about knowsAbout has Gun Reviews:', 'Gun Reviews' in h)
st, a = get('/admin-app/index.html', DESK)
print('admin-app', st, 'renderReviews' in a, 'renderCompetitions' in a, "'/competitions'" in a, "api('/api/competitions')" in a)
for p in ['/sitemap.xml','/robots.txt','/feeds/opml','/rss']:
    st, h = get(p, DESK); print(p, st, 'removed-refs:', [r for r in REMOVED if r in h] or 'none')
for p in ['/api/admin/reviews-manager']:
    print(p, get(p, DESK)[0])
