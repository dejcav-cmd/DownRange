#!/usr/bin/env python3
"""Push probe.json to docs/giveaway-probe.json via the Contents API.
(GITHUB_TOKEN git push is unreliable inside workflows; Contents API is not.)"""
import base64, json, os, urllib.request, urllib.error

REPO = 'dejcav-cmd/DownRange'
PATH = 'docs/giveaway-probe.json'
TOK  = os.environ['GH_PAT']
API  = f'https://api.github.com/repos/{REPO}/contents/{PATH}'
H    = {'Authorization': 'Bearer ' + TOK, 'Accept': 'application/vnd.github+json'}


def call(url, method='GET', payload=None):
    data = json.dumps(payload).encode() if payload else None
    req = urllib.request.Request(url, data=data, headers=H, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read() or b'{}')
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b'{}')


sha = None
code, body = call(API)
if code == 200:
    sha = body.get('sha')

content = base64.b64encode(open('probe.json', 'rb').read()).decode()
payload = {'message': 'chore: giveaway source probe results', 'content': content,
           'branch': 'main'}
if sha:
    payload['sha'] = sha
code, body = call(API, 'PUT', payload)
print('publish status:', code)
if code >= 300:
    print(json.dumps(body)[:500])
    raise SystemExit(1)
