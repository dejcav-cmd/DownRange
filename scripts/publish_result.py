#!/usr/bin/env python3
"""PUT a local file into the repo via the Contents API.
Azure blob action logs aren't reachable from the sandbox, and GITHUB_TOKEN git
push is unreliable inside workflows — Contents API is the dependable readback."""
import base64, json, os, sys, urllib.request, urllib.error

src, dest = sys.argv[1], sys.argv[2]
API = f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{dest}"
H = {'Authorization': 'Bearer ' + os.environ['GH_PAT'], 'Accept': 'application/vnd.github+json'}


def call(method='GET', payload=None):
    data = json.dumps(payload).encode() if payload else None
    try:
        with urllib.request.urlopen(urllib.request.Request(API, data=data, headers=H, method=method), timeout=30) as r:
            return r.status, json.loads(r.read() or b'{}')
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b'{}')


code, body = call()
payload = {'message': f'chore: {dest}', 'branch': 'main',
           'content': base64.b64encode(open(src, 'rb').read()).decode()}
if code == 200:
    payload['sha'] = body.get('sha')
code, body = call('PUT', payload)
print('publish', code)
sys.exit(0 if code < 300 else 1)
