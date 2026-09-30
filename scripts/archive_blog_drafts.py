import os, json, base64, urllib.request, urllib.parse, datetime
TOK = os.environ['SANITY_API_TOKEN'].replace('ST=', '').strip()
BASE = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data'
cutoff = (datetime.datetime.utcnow() - datetime.timedelta(days=15)).isoformat() + 'Z'
Q = '*[_type=="blogPost" && status!="published" && published!=true && status!="archived" && _createdAt < $c]'
def q(query):
    u = f'{BASE}/query/production?query=' + urllib.parse.quote(query) + '&$c=' + urllib.parse.quote(json.dumps(cutoff))
    return json.loads(urllib.request.urlopen(urllib.request.Request(u, headers={'Authorization': 'Bearer ' + TOK}), timeout=60).read())['result']
docs = q(Q)
out = [f'matched {len(docs)} (cutoff {cutoff})']
day = datetime.date.today().isoformat()
payload = json.dumps({'exportedAt': datetime.datetime.utcnow().isoformat() + 'Z', 'cutoff': cutoff, 'count': len(docs), 'documents': docs}, indent=1).encode()
b64 = base64.b64encode(payload).decode()
def put(repo, path, token):
    api = f'https://api.github.com/repos/dejcav-cmd/{repo}/contents/{path}'
    body = {'message': f'backup: {len(docs)} unpublished blog posts before archive ({day})', 'content': b64}
    urllib.request.urlopen(urllib.request.Request(api, data=json.dumps(body).encode(), headers={'Authorization': 'token ' + token, 'Accept': 'application/vnd.github+json'}, method='PUT'), timeout=60)
    return f'{repo}/{path}'
backup = None
for repo, path, tok in [('DownRange-Backups', f'blog-archive/blog-drafts-{day}.json', os.environ.get('GH_PAT', '')),
                        ('DownRange', f'backups/blog-archive/blog-drafts-{day}.json', os.environ['GH_TOKEN'])]:
    if not tok: continue
    try:
        backup = put(repo, path, tok); break
    except Exception as e:
        out.append(f'backup to {repo} failed: {e}')
if not backup or not docs:
    out.append('NO BACKUP -> not archiving' if docs else 'nothing to archive')
else:
    out.append('backup: ' + backup + f' ({len(payload)//1024} KB)')
    now = datetime.datetime.utcnow().isoformat() + 'Z'
    muts = [{'patch': {'id': d['_id'], 'set': {'status': 'archived', 'published': False, 'archivedAt': now}}} for d in docs]
    for i in range(0, len(muts), 100):
        r = urllib.request.Request(f'{BASE}/mutate/production?returnDocuments=false', data=json.dumps({'mutations': muts[i:i+100]}).encode(),
                                   headers={'Authorization': 'Bearer ' + TOK, 'Content-Type': 'application/json'}, method='POST')
        urllib.request.urlopen(r, timeout=60).read()
    left = q(Q)
    out.append(f'archived {len(docs)}; remaining unarchived matches: {len(left)}')
    out.append('published untouched: ' + str(q('count(*[_type=="blogPost" && (status=="published" || published==true)])')))
res = '\n'.join(out); print(res)
api = 'https://api.github.com/repos/dejcav-cmd/DownRange/contents/scripts/archive_result.txt'
urllib.request.urlopen(urllib.request.Request(api, data=json.dumps({'message': 'chore: archive result [skip ci]', 'content': base64.b64encode(res.encode()).decode()}).encode(), headers={'Authorization': 'token ' + os.environ['GH_TOKEN']}, method='PUT'))
