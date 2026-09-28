import sys, os, json, base64, urllib.request
src, dest = sys.argv[1], sys.argv[2]
api = f'https://api.github.com/repos/dejcav-cmd/DownRange/contents/{dest}'
h = {'Authorization': 'token ' + os.environ['GH_TOKEN'], 'Accept': 'application/vnd.github+json'}
sha = None
try: sha = json.loads(urllib.request.urlopen(urllib.request.Request(api, headers=h)).read())['sha']
except Exception: pass
body = {'message': 'chore: verify result [skip ci]', 'content': base64.b64encode(open(src, 'rb').read()).decode()}
if sha: body['sha'] = sha
urllib.request.urlopen(urllib.request.Request(api, data=json.dumps(body).encode(), headers=h, method='PUT'))
