import urllib.request, urllib.parse, json, os, sys, traceback, base64
from datetime import datetime, timedelta, timezone

def log(s): print(s, flush=True)

try:
    token = os.environ.get('SANITY_TOKEN', '')
    gh_token = os.environ.get('GH_PAT', '')
    
    since = (datetime.now(timezone.utc) - timedelta(hours=24)).strftime('%Y-%m-%dT%H:%M:%SZ')
    log(f'Since: {since}')

    query = '*[_type=="newsArticle"&&_createdAt>"' + since + '"]|order(_createdAt desc)[0...50]{title,"slug":slug.current,_createdAt,source}'
    url = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production?query=' + urllib.parse.quote(query) + '&returnQuery=false'
    req = urllib.request.Request(url, headers={'Authorization': 'Bearer ' + token})
    with urllib.request.urlopen(req, timeout=20) as r:
        data = json.loads(r.read())

    results = data.get('result', [])
    lines = [f'FOUND: {len(results)} articles in last 24h\n']
    for a in results:
        slug = a.get('slug', '')
        title = (a.get('title') or '')[:80]
        created = (a.get('_createdAt') or '')[:19]
        source = a.get('source', '')
        lines.append(f'[{created}] {title}')
        lines.append(f'  https://downrangeco.com/news/{slug}  ({source})')
        lines.append('')
    
    output = '\n'.join(lines)
    log(output)

    # Write directly to GitHub via Contents API
    content_b64 = base64.b64encode(output.encode()).decode()
    
    # Check if file exists for SHA
    check_req = urllib.request.Request(
        'https://api.github.com/repos/dejcav-cmd/DownRange/contents/scripts/ARTICLES.txt',
        headers={'Authorization': f'token {gh_token}'}
    )
    sha = ''
    try:
        with urllib.request.urlopen(check_req) as r:
            sha = json.loads(r.read()).get('sha', '')
    except: pass
    
    body = {'message': 'ci: article list', 'committer': {'name': 'CI', 'email': 'dj@downrangeco.com'}, 'content': content_b64}
    if sha: body['sha'] = sha
    
    put_req = urllib.request.Request(
        'https://api.github.com/repos/dejcav-cmd/DownRange/contents/scripts/ARTICLES.txt',
        data=json.dumps(body).encode(),
        headers={'Authorization': f'token {gh_token}', 'Content-Type': 'application/json'},
        method='PUT'
    )
    with urllib.request.urlopen(put_req) as r:
        log(f'Written to repo: HTTP {r.status}')

except Exception as e:
    log(f'ERROR: {e}')
    traceback.print_exc()
    sys.exit(1)
