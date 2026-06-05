import urllib.request, json, os, base64

ADMIN_KEY = os.environ.get('ADMIN_KEY','')
lines = []

req = urllib.request.Request(
    'https://downrangeco.com/api/admin/backfill-images',
    data=json.dumps({'types':['canadaContent','brazilContent'],'limit':50}).encode(),
    headers={'x-admin-key': ADMIN_KEY, 'Content-Type': 'application/json'},
    method='POST'
)
with urllib.request.urlopen(req, timeout=240) as r:
    d = json.loads(r.read())

lines.append(f'ok: {d.get("ok")}')
lines.append(f'fixed: {d.get("fixed")} / {d.get("total")}')
for r in d.get('results',[]):
    status = r.get('status','')
    title  = r.get('title','')
    url    = r.get('url','')
    lines.append(f'  [{status}] {title}')
    if url: lines.append(f'    -> {url}')

output = '\n'.join(lines)
print(output)

# Write to ARTICLES.txt via GH
GH = os.environ.get('GH_PAT','')
if GH:
    sha_r = urllib.request.urlopen(urllib.request.Request(
        'https://api.github.com/repos/dejcav-cmd/DownRange/contents/scripts/ARTICLES.txt',
        headers={'Authorization': f'token {GH}'}), timeout=10)
    sha = json.loads(sha_r.read()).get('sha','')
    body = json.dumps({'message':'ci: backfill result','committer':{'name':'CI','email':'dj@downrangeco.com'},
                      'content':base64.b64encode(output.encode()).decode(),'sha':sha}).encode()
    urllib.request.urlopen(urllib.request.Request(
        'https://api.github.com/repos/dejcav-cmd/DownRange/contents/scripts/ARTICLES.txt',
        data=body, headers={'Authorization':f'token {GH}','Content-Type':'application/json'}, method='PUT'), timeout=10)
    print('Written to ARTICLES.txt')
