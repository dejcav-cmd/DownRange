import urllib.request, urllib.parse, json, os, base64

T = os.environ['SANITY_TOKEN']
GH = os.environ.get('GH_PAT','')
BASE = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production'

def q(query):
    url = BASE + '?query=' + urllib.parse.quote(query) + '&returnQuery=false'
    req = urllib.request.Request(url, headers={'Authorization': 'Bearer ' + T})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read()).get('result', [])

articles = q('*[_type=="canadaContent" && type=="article"] | order(_createdAt desc)[0...10]{_id, title, imageUrl}')
lines = []
for a in articles:
    img = a.get('imageUrl','') or ''
    lines.append(f'{(a.get("title") or "")[:45]}')
    lines.append(f'  {img}')
    lines.append('')

output = '\n'.join(lines)
print(output)

if GH:
    try:
        sha_r = urllib.request.urlopen(urllib.request.Request(
            'https://api.github.com/repos/dejcav-cmd/DownRange/contents/scripts/ARTICLES.txt',
            headers={'Authorization': f'token {GH}'}), timeout=10)
        sha = json.loads(sha_r.read()).get('sha','')
        body = json.dumps({'message':'ci: full img urls','committer':{'name':'CI','email':'dj@downrangeco.com'},
                          'content':base64.b64encode(output.encode()).decode(),'sha':sha}).encode()
        urllib.request.urlopen(urllib.request.Request(
            'https://api.github.com/repos/dejcav-cmd/DownRange/contents/scripts/ARTICLES.txt',
            data=body, headers={'Authorization':f'token {GH}','Content-Type':'application/json'}, method='PUT'), timeout=10)
    except: pass
